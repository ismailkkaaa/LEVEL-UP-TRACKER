// Level Up Tracker App
class LevelUpTracker {
    constructor() {
        this.state = {
            level: 1,
            xp: 0,
            xpNeeded: 100,
            streak: 0,
            totalXp: 0,
            overallStreak: 0,
            habitsCompleted: 0,
            dailyHabits: {},
            weeklyStats: {
                completed: 0,
                missed: 0,
                rate: 0
            },
            weight: null,
            waist: null,
            energy: 3,
            unlockedBadges: [],
            currentDate: new Date().toISOString().split('T')[0]
        };
        
        this.levelThresholds = [
            { level: 1, name: "Beginner", minXp: 0 },
            { level: 6, name: "Consistent", minXp: 500 },
            { level: 11, name: "Disciplined", minXp: 1500 },
            { level: 21, name: "Beast Mode", minXp: 4000 }
        ];
        
        this.motivationalQuotes = [
            "Success is the sum of small efforts repeated day in and day out.",
            "Your body can do it—it's your mind you need to convince.",
            "Progress, not perfection.",
            "Every workout you skip is a victory you give away to your excuses.",
            "The pain you feel today will be the strength you feel tomorrow.",
            "Discipline is choosing between what you want now and what you want most.",
            "Your only bad workout is the one you didn't do.",
            "Don't wish for it, work for it.",
            "The difference between ordinary and extraordinary is that little extra.",
            "Your future self will thank you for what you do today."
        ];
        
        this.badges = [
            { id: "7day_streak", name: "7-Day Streak", desc: "Complete 7 days in a row", icon: "🔥", requirement: () => this.state.streak >= 7 },
            { id: "first_gym_week", name: "First Gym Week", desc: "Complete gym workout 5 days in one week", icon: "💪", requirement: () => this.getGymWorkoutsThisWeek() >= 5 },
            { id: "no_junk_week", name: "No Junk Week", desc: "Avoid junk food for 7 days straight", icon: "🚫", requirement: () => this.getNoJunkStreak() >= 7 },
            { id: "hydration_master", name: "Hydration Master", desc: "Drink 3L+ water for 5 days in a week", icon: "💧", requirement: () => this.getHydrationAchievement() },
            { id: "early_bird", name: "Early Bird", desc: "Wake up on time for 10 days", icon: "🌅", requirement: () => this.getHabitCount("wake-up") >= 10 },
            { id: "discipline_pro", name: "Discipline Pro", desc: "Reach Level 10", icon: "🏆", requirement: () => this.state.level >= 10 },
            { id: "beast_mode", name: "Beast Mode", desc: "Reach Level 21", icon: "⚡", requirement: () => this.state.level >= 21 }
        ];
        
        this.init();
    }
    
    init() {
        this.loadState();
        this.setupEventListeners();
        this.updateUI();
        this.startAnimations();
        
        // Check if today's habits are already submitted and disable submit button if so
        this.checkTodaySubmission();
        
        // Set a random motivational quote
        this.setRandomQuote();
    }
    
    checkTodaySubmission() {
        const today = new Date().toISOString().split('T')[0];
        
        // Check if today's logs exist
        if (this.state.dailyLogs && this.state.dailyLogs[today]) {
            // Disable submit button
            const submitBtn = document.getElementById('submit-habits-btn');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Submitted ✅';
            }
            
            // Disable all habit checkboxes
            document.querySelectorAll('input[type="checkbox"][data-xp]').forEach(checkbox => {
                checkbox.disabled = true;
            });
            
            // Disable water slider
            const waterSlider = document.getElementById('water-intake');
            if (waterSlider) {
                waterSlider.disabled = true;
            }
        }
    }
    
    loadState() {
        const savedState = localStorage.getItem('levelUpTrackerState');
        if (savedState) {
            this.state = { ...this.state, ...JSON.parse(savedState) };
        } else {
            // Initialize with default habits for today
            this.initializeDailyHabits();
        }
        
        // Check if it's a new day and reset habits if needed
        const today = new Date().toISOString().split('T')[0];
        if (this.state.currentDate !== today) {
            this.resetDailyHabits();
            this.state.currentDate = today;
        }
    }
    
    saveState() {
        localStorage.setItem('levelUpTrackerState', JSON.stringify(this.state));
    }
    
    initializeDailyHabits() {
        const habitIds = ['wake-up', 'green-tea', 'breakfast', 'fruits-snack', 'lunch', 'evening-drink', 'pre-workout', 'gym', 'dinner', 'sleep', 'no-junk'];
        this.state.dailyHabits = {};
        
        habitIds.forEach(id => {
            this.state.dailyHabits[id] = {
                completed: false,
                xp: this.getXpValue(id)
            };
        });
        
        // Initialize water intake
        this.state.dailyHabits['water-intake'] = {
            value: 0,
            xp: 0 // Will be calculated based on amount
        };
    }
    
    resetDailyHabits() {
        // Check yesterday's streak to update overall streak
        const yesterdayCompleted = Object.values(this.state.dailyHabits).filter(h => h.completed || (h.value && h.value >= 3)).length;
        const totalHabits = Object.keys(this.state.dailyHabits).length - 1; // Subtract water
        
        if (yesterdayCompleted > totalHabits * 0.8) { // If completed 80% of habits
            this.state.overallStreak += 1;
        } else {
            this.state.streak = 0; // Reset daily streak if missed yesterday
        }
        
        // Reset habits for today
        this.initializeDailyHabits();
        this.state.weeklyStats.completed = 0;
        this.state.weeklyStats.missed = 0;
        this.state.weeklyStats.rate = 0;
    }
    
    getXpValue(habitId) {
        const xpValues = {
            'wake-up': 5,
            'green-tea': 5,
            'breakfast': 10,
            'fruits-snack': 5,
            'lunch': 10,
            'evening-drink': 5,
            'pre-workout': 5,
            'gym': 20,
            'dinner': 10,
            'sleep': 10,
            'no-junk': 15
        };
        return xpValues[habitId] || 0;
    }
    
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.showPage(e.target.dataset.page);
            });
        });
        
        // Habit checkboxes
        document.querySelectorAll('input[type="checkbox"][data-xp]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.toggleHabit(e.target.id, e.target.checked);
            });
        });
        
        // Water intake slider
        const waterSlider = document.getElementById('water-intake');
        if (waterSlider) {
            waterSlider.addEventListener('input', (e) => {
                this.updateWaterIntake(parseFloat(e.target.value));
            });
        }
        
        // Weight and waist inputs
        document.getElementById('weight')?.addEventListener('change', (e) => {
            this.state.weight = parseFloat(e.target.value);
            this.saveState();
        });
        
        document.getElementById('waist')?.addEventListener('change', (e) => {
            this.state.waist = parseFloat(e.target.value);
            this.saveState();
        });
        
        document.getElementById('energy')?.addEventListener('change', (e) => {
            this.state.energy = parseInt(e.target.value);
            this.saveState();
        });
        
        // Settings toggles
        document.getElementById('dark-mode-toggle')?.addEventListener('change', (e) => {
            this.toggleDarkMode(e.target.checked);
        });
        
        document.getElementById('reset-week-btn')?.addEventListener('click', () => {
            this.resetWeek();
        });
        
        document.getElementById('export-data-btn')?.addEventListener('click', () => {
            this.exportData();
        });
        
        document.getElementById('import-data-btn')?.addEventListener('click', () => {
            this.importData();
        });
        
        // Submit habits button
        document.getElementById('submit-habits-btn')?.addEventListener('click', () => {
            this.submitHabits();
        });
    }
    
    showPage(pageId) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        // Remove active class from all nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected page
        document.getElementById(pageId).classList.add('active');
        
        // Activate corresponding nav button
        document.querySelector(`[data-page="${pageId}"]`).classList.add('active');
        
        // Update badges page if showing rewards
        if (pageId === 'rewards') {
            this.updateBadgesDisplay();
        }
    }
    
    toggleHabit(habitId, completed) {
        if (!this.state.dailyHabits[habitId]) return;
        
        this.state.dailyHabits[habitId].completed = completed;
        
        if (completed) {
            const xpEarned = this.state.dailyHabits[habitId].xp;
            this.addXp(xpEarned);
            this.state.habitsCompleted += 1;
            
            // Play sound when habit is completed
            this.playHabitCompleteSound();
        } else {
            const xpRemoved = this.state.dailyHabits[habitId].xp;
            this.removeXp(xpRemoved);
            this.state.habitsCompleted = Math.max(0, this.state.habitsCompleted - 1);
        }
        
        this.updateStreak();
        this.updateWeeklyStats();
        this.saveState();
        this.updateUI();
    }
    
    updateWaterIntake(amount) {
        this.state.dailyHabits['water-intake'].value = amount;
        document.getElementById('water-value').textContent = `${amount}L`;
        
        // Calculate XP for water (2 XP per liter, max 8 XP for 4L)
        const xpFromWater = Math.min(Math.floor(amount * 2), 8);
        this.state.dailyHabits['water-intake'].xp = xpFromWater;
        
        this.updateUI();
        this.saveState();
    }
    
    addXp(amount) {
        this.state.xp += amount;
        this.state.totalXp += amount;
        
        // Check if leveled up
        if (this.state.xp >= this.state.xpNeeded) {
            this.levelUp();
        }
    }
    
    removeXp(amount) {
        this.state.xp = Math.max(0, this.state.xp - amount);
        
        // Recalculate level if needed
        this.recalculateLevel();
    }
    
    levelUp() {
        this.state.level += 1;
        this.state.xp -= this.state.xpNeeded;
        this.state.xpNeeded = 100 + (this.state.level - 1) * 50; // Increase XP needed per level
        
        // Show level up animation
        this.showLevelUpAnimation();
        
        // Update streak on level up
        this.state.streak += 1;
        
        // Check for new badges
        this.checkBadges();
    }
    
    recalculateLevel() {
        // Calculate what level the user should be based on total XP
        let tempXp = this.state.totalXp;
        let level = 1;
        let xpNeeded = 100;
        
        while (tempXp >= xpNeeded) {
            tempXp -= xpNeeded;
            level += 1;
            xpNeeded = 100 + (level - 1) * 50;
        }
        
        this.state.level = level;
        this.state.xp = tempXp;
        this.state.xpNeeded = xpNeeded;
    }
    
    updateStreak() {
        // Count completed habits for today
        const completedToday = Object.values(this.state.dailyHabits).filter(h => 
            (typeof h.completed === 'boolean' && h.completed) || 
            (typeof h.value === 'number' && h.value >= 3) // For water intake
        ).length;
        
        const totalHabits = Object.keys(this.state.dailyHabits).length - 1; // Exclude water
        const waterHabit = this.state.dailyHabits['water-intake'];
        
        // If water is 3L+ then count as completed
        const waterCompleted = waterHabit && waterHabit.value >= 3;
        
        if (completedToday + (waterCompleted ? 1 : 0) >= totalHabits * 0.8) {
            this.state.streak += 1;
        } else if (completedToday + (waterCompleted ? 1 : 0) < totalHabits * 0.3) {
            // If very few habits completed, reduce streak
            this.state.streak = Math.max(0, this.state.streak - 1);
        }
    }
    
    updateWeeklyStats() {
        // For simplicity, we'll calculate based on habits completed today
        // In a real app, you'd track this over the actual week
        const completedHabits = Object.values(this.state.dailyHabits).filter(h => 
            (typeof h.completed === 'boolean' && h.completed) || 
            (typeof h.value === 'number' && h.value >= 3)
        ).length;
        
        this.state.weeklyStats.completed = completedHabits;
        this.state.weeklyStats.missed = Object.keys(this.state.dailyHabits).length - completedHabits;
        
        if (Object.keys(this.state.dailyHabits).length > 0) {
            this.state.weeklyStats.rate = Math.round((completedHabits / Object.keys(this.state.dailyHabits).length) * 100);
        }
    }
    
    updateUI() {
        // Update dashboard
        document.getElementById('current-level').textContent = this.state.level;
        document.getElementById('current-xp').textContent = this.state.xp;
        document.getElementById('xp-needed').textContent = this.state.xpNeeded;
        
        // Update XP progress bar
        const xpPercent = (this.state.xp / this.state.xpNeeded) * 100;
        document.getElementById('xp-progress').style.width = `${Math.min(xpPercent, 100)}%`;
        
        // Update streak
        document.getElementById('streak-count').textContent = this.state.streak;
        
        // Update level badge
        const levelBadge = document.getElementById('level-badge');
        const levelInfo = this.getLevelInfo();
        levelBadge.textContent = levelInfo.name;
        levelBadge.style.color = this.getLevelColor(levelInfo.name);
        
        // Update today's progress
        this.updateTodayProgress();
        
        // Update weekly stats
        document.getElementById('days-completed').textContent = this.state.weeklyStats.completed;
        document.getElementById('days-missed').textContent = this.state.weeklyStats.missed;
        document.getElementById('completion-rate').textContent = `${this.state.weeklyStats.rate}%`;
        
        // Update settings page data
        document.getElementById('total-xp-display').textContent = this.state.totalXp;
        document.getElementById('overall-streak-display').textContent = this.state.overallStreak;
        document.getElementById('habits-completed-display').textContent = this.state.habitsCompleted;
        
        // Update form inputs
        if (this.state.weight) document.getElementById('weight').value = this.state.weight;
        if (this.state.waist) document.getElementById('waist').value = this.state.waist;
        if (this.state.energy) document.getElementById('energy').value = this.state.energy;
        
        // Update habit checkboxes
        Object.keys(this.state.dailyHabits).forEach(habitId => {
            const habit = this.state.dailyHabits[habitId];
            const element = document.getElementById(habitId);
            
            if (element && typeof habit.completed !== 'undefined') {
                element.checked = habit.completed;
            } else if (habitId === 'water-intake') {
                const waterSlider = document.getElementById('water-intake');
                const waterValue = document.getElementById('water-value');
                
                if (waterSlider && waterValue) {
                    waterSlider.value = habit.value || 0;
                    waterValue.textContent = `${habit.value || 0}L`;
                }
            }
        });
    }
    
    updateTodayProgress() {
        const completedHabits = Object.values(this.state.dailyHabits).filter(h => 
            (typeof h.completed === 'boolean' && h.completed) || 
            (typeof h.value === 'number' && h.value >= 3)
        ).length;
        
        const totalHabits = Object.keys(this.state.dailyHabits).length;
        const progressPercent = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;
        
        document.getElementById('today-progress-percent').textContent = `${progressPercent}%`;
        
        // Update circular progress chart
        const circumference = 2 * Math.PI * 15.9155;
        const offset = circumference - (progressPercent / 100) * circumference;
        
        const progressPath = document.getElementById('today-progress-path');
        if (progressPath) {
            progressPath.style.strokeDasharray = `${circumference} ${circumference}`;
            progressPath.style.strokeDashoffset = offset;
        }
    }
    
    getLevelInfo() {
        // Find the highest threshold the user has reached
        let levelInfo = this.levelThresholds[0]; // Default to first level
        
        for (let i = this.levelThresholds.length - 1; i >= 0; i--) {
            if (this.state.totalXp >= this.levelThresholds[i].minXp) {
                levelInfo = this.levelThresholds[i];
                break;
            }
        }
        
        return levelInfo;
    }
    
    getLevelColor(levelName) {
        switch(levelName) {
            case "Beginner": return "#00ff88";
            case "Consistent": return "#00ccff";
            case "Disciplined": return "#9d4edd";
            case "Beast Mode": return "#ffcc00";
            default: return "#00ff88";
        }
    }
    
    setRandomQuote() {
        const randomIndex = Math.floor(Math.random() * this.motivationalQuotes.length);
        document.getElementById('motivational-quote').textContent = this.motivationalQuotes[randomIndex];
    }
    
    showLevelUpAnimation() {
        const levelUpEl = document.getElementById('level-up-animation');
        const newLevelEl = document.getElementById('new-level-display');
        
        newLevelEl.textContent = this.state.level;
        
        levelUpEl.classList.add('show');
        
        // Play sound effect (in a real app, you'd have an audio file)
        this.playLevelUpSound();
        
        setTimeout(() => {
            levelUpEl.classList.remove('show');
        }, 3000);
    }
    
    async playLevelUpSound() {
        try {
            // Create audio context for sound generation
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create oscillator for the sound
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Configure the sound - rising pitch for level up
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
            oscillator.frequency.exponentialRampToValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
            oscillator.frequency.exponentialRampToValueAtTime(1046.50, audioContext.currentTime + 0.4); // C6
            
            // Configure volume
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
            gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            console.log("Web Audio API not supported, playing level up sound via console");
        }
    }
    
    // Play sound for habit completion
    async playHabitCompleteSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime); // E5
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.05);
            gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.15);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.15);
        } catch (e) {
            console.log("Web Audio API not supported, playing habit complete sound via console");
        }
    }
    
    checkBadges() {
        this.badges.forEach(badge => {
            if (badge.requirement() && !this.state.unlockedBadges.includes(badge.id)) {
                this.state.unlockedBadges.push(badge.id);
            }
        });
    }
    
    updateBadgesDisplay() {
        const container = document.getElementById('badges-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.badges.forEach(badge => {
            const badgeElement = document.createElement('div');
            badgeElement.className = `badge-item ${this.state.unlockedBadges.includes(badge.id) ? 'unlocked' : ''}`;
            badgeElement.innerHTML = `
                <span class="badge-icon">${badge.icon}</span>
                <div class="badge-name">${badge.name}</div>
                <div class="badge-desc">${badge.desc}</div>
            `;
            container.appendChild(badgeElement);
        });
    }
    
    // Helper methods for badge requirements
    getGymWorkoutsThisWeek() {
        // Simplified for demo - in real app would track weekly data
        return this.state.dailyHabits['gym']?.completed ? 1 : 0;
    }
    
    getNoJunkStreak() {
        // Simplified for demo
        return this.state.dailyHabits['no-junk']?.completed ? this.state.streak : 0;
    }
    
    getHydrationAchievement() {
        // Check if water intake is 3L+ for 5 days in the current week
        const waterHabit = this.state.dailyHabits['water-intake'];
        return waterHabit && waterHabit.value >= 3;
    }
    
    getHabitCount(habitId) {
        // Simplified for demo
        return this.state.dailyHabits[habitId]?.completed ? this.state.streak : 0;
    }
    
    toggleDarkMode(enabled) {
        if (enabled) {
            document.body.style.backgroundColor = 'var(--bg-primary)';
        } else {
            document.body.style.backgroundColor = '#ffffff';
            // You could add light mode styles here
        }
        this.saveState();
    }
    
    resetWeek() {
        // Show confirmation dialog before reset
        const result = confirm('Are you sure you want to reset this week?');
        
        if (result) {
            // Show loading screen briefly during reset
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.classList.remove('hidden');
            }
            
            console.log('Starting reset of weekly data');
            
            // Identify and CLEAR ONLY these keys:
            // - weeklyProgress
            // - weeklyXP
            // - weeklyHabits
            // - weeklyChartData
            this.state.weeklyStats = { completed: 0, missed: 0, rate: 0 };
            this.state.weight = null;
            this.state.waist = null;
            this.state.energy = 3;
            
            // Reset today's habits but preserve:
            // - totalXP (don't reset)
            // - level (don't reset)
            // - badges (don't reset)
            this.initializeDailyHabits();
            
            // Clear daily logs for current week (but keep total XP, level, badges)
            // Get the start of the current week
            const today = new Date();
            const dayOfWeek = today.getDay(); // Sunday = 0, Monday = 1, etc.
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - dayOfWeek); // Set to Sunday of current week
            startOfWeek.setHours(0, 0, 0, 0);
            
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday of current week
            
            // Remove only logs from the current week
            if (this.state.dailyLogs) {
                const newLogs = {};
                for (const date in this.state.dailyLogs) {
                    const logDate = new Date(date);
                    // Only keep logs that are NOT from the current week
                    if (logDate < startOfWeek || logDate > endOfWeek) {
                        newLogs[date] = this.state.dailyLogs[date];
                    }
                }
                this.state.dailyLogs = newLogs;
            }
            
            this.saveState();
            
            // Immediately re-render UI
            this.updateUI();
            
            // Show success feedback
            this.showToast('Weekly progress reset', 'success');
            
            // Hide loading screen after a brief moment
            setTimeout(() => {
                if (loadingScreen) {
                    loadingScreen.classList.add('hidden');
                }
            }, 300);
            
            console.log('Weekly data cleared, UI updated');
        }
    }
    
    exportData() {
        const dataStr = JSON.stringify(this.state);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'level-up-tracker-data.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }
    
    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        
        input.onchange = e => {
            const file = e.target.files[0];
            const reader = new FileReader();
            
            reader.onload = event => {
                try {
                    const importedData = JSON.parse(event.target.result);
                    this.state = { ...this.state, ...importedData };
                    this.saveState();
                    this.updateUI();
                    alert('Data imported successfully!');
                } catch (error) {
                    alert('Error importing data. Please check the file format.');
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    }
    
    drawWeeklyChart() {
        const canvas = document.getElementById('weekly-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw chart background
        ctx.fillStyle = 'rgba(42, 42, 42, 0.7)';
        ctx.fillRect(0, 0, width, height);
        
        // Define chart dimensions
        const marginTop = 30;
        const marginBottom = 40;
        const marginLeft = 50;
        const marginRight = 20;
        const chartWidth = width - marginLeft - marginRight;
        const chartHeight = height - marginTop - marginBottom;
        
        // Draw axes
        ctx.strokeStyle = '#b0b0b0';
        ctx.lineWidth = 1;
        
        // X-axis
        ctx.beginPath();
        ctx.moveTo(marginLeft, height - marginBottom);
        ctx.lineTo(width - marginRight, height - marginBottom);
        ctx.stroke();
        
        // Y-axis
        ctx.beginPath();
        ctx.moveTo(marginLeft, marginTop);
        ctx.lineTo(marginLeft, height - marginBottom);
        ctx.stroke();
        
        // Draw grid lines and labels
        ctx.font = '10px Poppins';
        ctx.fillStyle = '#b0b0b0';
        
        // Horizontal grid lines and Y-axis labels
        for (let i = 0; i <= 5; i++) {
            const y = height - marginBottom - (i * (chartHeight / 5));
            
            // Draw grid line
            ctx.beginPath();
            ctx.moveTo(marginLeft, y);
            ctx.lineTo(width - marginRight, y);
            ctx.strokeStyle = 'rgba(176, 176, 176, 0.2)';
            ctx.stroke();
            
            // Draw label
            ctx.textAlign = 'right';
            ctx.fillText((5 - i) * 2 + '', marginLeft - 5, y + 4);
        }
        
        // X-axis labels and vertical bars (simulated weekly data)
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const dayData = [4, 5, 3, 6, 2, 5, 4]; // Simulated data
        
        const barWidth = chartWidth / days.length * 0.6;
        const spacing = chartWidth / days.length * 0.4;
        
        for (let i = 0; i < days.length; i++) {
            const x = marginLeft + i * (chartWidth / days.length) + spacing / 2;
            
            // Draw bar
            const barHeight = (dayData[i] / 6) * chartHeight;
            const barY = height - marginBottom - barHeight;
            
            // Gradient for bar
            const gradient = ctx.createLinearGradient(0, barY, 0, height - marginBottom);
            gradient.addColorStop(0, '#00ff88');
            gradient.addColorStop(1, '#00ccff');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x, barY, barWidth, barHeight);
            
            // Draw day label
            ctx.textAlign = 'center';
            ctx.fillText(days[i], x + barWidth / 2, height - marginBottom + 15);
        }
        
        // Chart title
        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 12px Poppins';
        ctx.textAlign = 'center';
        ctx.fillText('Weekly Habit Completion', width / 2, 15);
    }
    
    startAnimations() {
        // Add subtle animations to cards on page load
        const cards = document.querySelectorAll('.card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
        
        // Draw the weekly chart
        setTimeout(() => {
            this.drawWeeklyChart();
        }, 500);
    }
    
    submitHabits() {
        console.log('Submit button clicked');
        
        const submitBtn = document.getElementById('submit-habits-btn');
        
        // Get today's date for unique key
        const today = new Date().toISOString().split('T')[0];
        
        // Check if today's habits are already submitted
        if (this.state.dailyLogs && this.state.dailyLogs[today]) {
            console.log('Today\'s habits already submitted');
            this.showToast('Today already submitted ✅', 'info');
            return; // Prevent double submission
        }
        
        // Calculate total XP earned from today's habits
        let todayXP = 0;
        
        // Process all habit checkbox states
        document.querySelectorAll('input[type="checkbox"][data-xp]').forEach(checkbox => {
            if (checkbox.checked) {
                const xpValue = parseInt(checkbox.getAttribute('data-xp'));
                todayXP += xpValue;
                
                // Update the state for this habit
                const habitId = checkbox.id;
                if (this.state.dailyHabits[habitId]) {
                    this.state.dailyHabits[habitId].completed = true;
                }
            }
        });
        
        // Handle water intake separately
        const waterSlider = document.getElementById('water-intake');
        if (waterSlider) {
            const waterAmount = parseFloat(waterSlider.value);
            // Calculate XP for water (2 XP per liter, max 8 XP for 4L)
            const waterXp = Math.min(Math.floor(waterAmount * 2), 8);
            if (waterAmount >= 3) { // If 3L+ water consumed
                todayXP += waterXp;
                this.state.dailyHabits['water-intake'].value = waterAmount;
                this.state.dailyHabits['water-intake'].xp = waterXp;
            }
        }
        
        console.log('Today\'s XP calculated:', todayXP);
        
        // Save today's data with unique date key
        if (!this.state.dailyLogs) {
            this.state.dailyLogs = {};
        }
        this.state.dailyLogs[today] = {
            xp: todayXP,
            date: today,
            habits: { ...this.state.dailyHabits }
        };
        
        // Update totals
        this.state.totalXP += todayXP;
        
        // Update level if needed
        if (todayXP > 0) {
            this.addXp(todayXP); // This will handle level ups
        }
        
        // Update streak
        this.updateStreak();
        
        // Lock today's checkboxes (set disabled = true)
        document.querySelectorAll('input[type="checkbox"][data-xp]').forEach(checkbox => {
            checkbox.disabled = true;
        });
        
        if (waterSlider) {
            waterSlider.disabled = true;
        }
        
        // Prevent double submission for same date
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitted ✅';
        
        // Update UI
        this.updateUI();
        
        // Save state
        this.saveState();
        
        // Show success feedback
        this.showToast('Today submitted ✅', 'success');
        
        console.log('Submit completed, data saved');
    }
    
    showToast(message, type = 'info') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = 'toast toast-' + type;
        toast.textContent = message;
        
        // Set background based on type
        if (type === 'success') {
            toast.style.background = 'var(--success)';
        } else if (type === 'error') {
            toast.style.background = 'var(--danger)';
        } else {
            toast.style.background = 'var(--bg-tertiary)';
        }
        
        // Set other styles
        toast.style.position = 'fixed';
        toast.style.bottom = '100px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.color = 'white';
        toast.style.padding = '12px 24px';
        toast.style.borderRadius = '24px';
        toast.style.zIndex = '10000';
        toast.style.fontSize = '14px';
        toast.style.fontWeight = '500';
        toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        toast.style.animation = 'slideIn 0.3s, fadeOut 0.5s 2.5s forwards';
        
        document.body.appendChild(toast);
        
        // Remove after animation
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
    
    triggerXPGainAnimation(amount) {
        // Create floating XP text animation
        const xpFloat = document.createElement('div');
        xpFloat.textContent = '+' + amount + ' XP';
        xpFloat.style.cssText = `
            position: fixed;
            bottom: 150px;
            left: 50%;
            transform: translateX(-50%);
            color: var(--accent-green);
            font-weight: bold;
            font-size: 24px;
            z-index: 10001;
            pointer-events: none;
            animation: floatUp 2s forwards;
        `;
        
        document.body.appendChild(xpFloat);
        
        // Remove after animation
        setTimeout(() => {
            xpFloat.remove();
        }, 2000);
    }
}

// Add animation keyframes dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes floatUp {
        0% {
            opacity: 1;
            transform: translate(-50%, 0);
        }
        100% {
            opacity: 0;
            transform: translate(-50%, -100px);
        }
    }
`;
document.head.appendChild(style);

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then((registration) => {
                console.log('ServiceWorker registered: ', registration);
            })
            .catch((error) => {
                console.log('ServiceWorker registration failed: ', error);
            });
    });
}

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then((registration) => {
                console.log('ServiceWorker registered: ', registration);
            })
            .catch((error) => {
                console.log('ServiceWorker registration failed: ', error);
            });
    });
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Show loading screen initially
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.classList.remove('hidden');
    }
    
    // Initialize the app after a brief delay to allow the loading screen to show
    setTimeout(() => {
        window.tracker = new LevelUpTracker();
        
        // Hide loading screen after initialization
        setTimeout(() => {
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
            }
        }, 500); // Small delay to ensure UI is ready
    }, 300); // Brief delay to ensure loading screen shows
});

// Add smooth scrolling for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
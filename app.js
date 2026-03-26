// ==================== DATA MANAGEMENT ====================
class DevMomentumApp {
    constructor() {
        this.data = this.loadData();
        this.timerInterval = null;
        this.breakInterval = null;
        this.isRunning = false;
        this.isBreak = false;
        this.currentEditingTaskId = null;
        this.init();
    }

    loadData() {
        const stored = localStorage.getItem('devMomentum');
        const defaultData = {
            streak: 0,
            lastActivityDate: null,
            focusTime: 0,
            sessions: 0,
            tasksCompleted: 0,
            tasks: [],
            darkMode: false
        };
        return stored ? { ...defaultData, ...JSON.parse(stored) } : defaultData;
    }

    saveData() {
        localStorage.setItem('devMomentum', JSON.stringify(this.data));
    }

    init() {
        this.setupEventListeners();
        this.updateUI();
        this.setGreeting();
        this.applyDarkMode();
        this.checkStreakReset();
    }

    setupEventListeners() {
        // Navigation
        document.getElementById('menuButton').addEventListener('click', () => this.toggleSidebar());
        document.getElementById('closeSidebar').addEventListener('click', () => this.toggleSidebar());
        document.getElementById('sidebarOverlay').addEventListener('click', () => this.toggleSidebar());

        // Page navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => this.navigateTo(e.target.closest('.nav-link').dataset.page));
        });

        // Dark mode
        document.getElementById('darkModeToggle').addEventListener('click', () => this.toggleDarkMode());

        // Dashboard
        document.getElementById('codedTodayBtn').addEventListener('click', () => this.recordCoding());
        document.getElementById('openCodeBtn').addEventListener('click', () => this.openCode());

        // Timer
        document.getElementById('startBtn').addEventListener('click', () => this.startTimer());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pauseTimer());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetTimer());

        // Tasks
        document.getElementById('addTaskBtn').addEventListener('click', () => this.addTask());
        document.getElementById('taskInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // Modal
        document.getElementById('saveEditBtn').addEventListener('click', () => this.saveEditTask());
        document.getElementById('cancelEditBtn').addEventListener('click', () => this.closeEditModal());
        document.getElementById('editTaskInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.saveEditTask();
        });
    }

    // ==================== NAVIGATION ====================
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    }

    navigateTo(page) {
        // Close sidebar
        document.getElementById('sidebar').classList.remove('active');
        document.getElementById('sidebarOverlay').classList.remove('active');

        // Hide all pages
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

        // Show selected page
        document.getElementById(page).classList.add('active');

        // Update nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.page === page);
        });
    }

    // ==================== DARK MODE ====================
    toggleDarkMode() {
        this.data.darkMode = !this.data.darkMode;
        this.applyDarkMode();
        this.saveData();
        this.showNotification('Dark mode ' + (this.data.darkMode ? 'enabled' : 'disabled'), 'success');
    }

    applyDarkMode() {
        if (this.data.darkMode) {
            document.body.classList.add('light-mode');
        } else {
            document.body.classList.remove('light-mode');
        }
    }

    // ==================== GREETING ====================
    setGreeting() {
        const hour = new Date().getHours();
        const greetingElement = document.getElementById('greetingText');
        const timeElement = document.getElementById('greetingTime');

        let greeting = 'Good Morning ☀️';
        if (hour >= 12 && hour < 17) greeting = 'Good Afternoon 🌤️';
        else if (hour >= 17 && hour < 21) greeting = 'Good Evening 🌙';
        else if (hour >= 21) greeting = 'Good Night 🌙';

        greetingElement.textContent = greeting;

        // Update time
        const now = new Date();
        timeElement.textContent = now.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        // Update every minute
        setInterval(() => {
            const now = new Date();
            timeElement.textContent = now.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        }, 60000);
    }

    // ==================== STREAK LOGIC ====================
    checkStreakReset() {
        const today = new Date().toDateString();
        const lastActivity = this.data.lastActivityDate;

        if (lastActivity && lastActivity !== today) {
            const lastDate = new Date(lastActivity);
            const todayDate = new Date();
            const dayDifference = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

            if (dayDifference > 1) {
                this.data.streak = 0;
                this.saveData();
            }
        }
    }

    recordCoding() {
        const today = new Date().toDateString();
        if (this.data.lastActivityDate === today) {
            this.showNotification('You already coded today! 🔥', 'warning');
            return;
        }

        this.data.streak += 1;
        this.data.lastActivityDate = today;
        this.saveData();
        this.updateUI();
        this.showNotification('Great job! Streak increased! 🔥', 'success');
    }

    openCode() {
        this.showNotification('Opening your code editor... 💻', 'success');
        // This would open the user's editor in a real app
    }

    // ==================== POMODORO TIMER ====================
    startTimer() {
        if (this.isRunning) return;

        this.isRunning = true;
        const startBtn = document.getElementById('startBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        startBtn.style.display = 'none';
        pauseBtn.style.display = 'block';

        // Get current timer value
        let timeLeft = this.getTimerSeconds();

        this.timerInterval = setInterval(() => {
            timeLeft--;

            if (timeLeft < 0) {
                this.completeSession();
                return;
            }

            // Update display
            this.updateTimerDisplay(timeLeft);
            this.updateTimerColor(timeLeft);

            // Save timer state
            sessionStorage.setItem('timerSeconds', timeLeft);
        }, 1000);

        this.showNotification('Focus session started! 💪', 'success');
    }

    pauseTimer() {
        this.isRunning = false;
        clearInterval(this.timerInterval);

        const startBtn = document.getElementById('startBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        startBtn.style.display = 'block';
        pauseBtn.style.display = 'none';

        this.showNotification('Focus session paused', 'warning');
    }

    resetTimer() {
        this.isRunning = false;
        clearInterval(this.timerInterval);
        clearInterval(this.breakInterval);
        this.isBreak = false;

        sessionStorage.removeItem('timerSeconds');

        const startBtn = document.getElementById('startBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        startBtn.style.display = 'block';
        pauseBtn.style.display = 'none';

        document.getElementById('breakIndicator').style.display = 'none';
        this.updateTimerDisplay(1500); // 25 minutes
        this.updateTimerColor(1500);
    }

    getTimerSeconds() {
        const stored = sessionStorage.getItem('timerSeconds');
        return stored ? parseInt(stored) : 1500; // 25 minutes default
    }

    updateTimerDisplay(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        const display = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        document.getElementById('timerDisplay').textContent = display;
    }

    updateTimerColor(seconds) {
        const display = document.getElementById('timerDisplay');
        // Change color to red when 5 minutes or less remain
        if (seconds <= 300) {
            display.classList.add('low-time');
        } else {
            display.classList.remove('low-time');
        }
    }

    completeSession() {
        clearInterval(this.timerInterval);
        this.isRunning = false;

        // Add break
        this.startBreak();

        // Update stats
        this.data.sessions += 1;
        this.data.focusTime += 25;
        this.data.tasksCompleted += 1;
        this.saveData();

        // Sound and notification
        this.playSound();
        this.showNotification('Focus session completed! 🎉', 'success');

        // Update UI
        this.updateUI();

        // Shake effect
        const display = document.getElementById('timerDisplay');
        display.classList.add('shake');
        setTimeout(() => display.classList.remove('shake'), 500);
    }

    startBreak() {
        this.isBreak = true;
        const breakIndicator = document.getElementById('breakIndicator');
        breakIndicator.style.display = 'block';

        let breakTime = 300; // 5 minutes
        const startBtn = document.getElementById('startBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        startBtn.style.display = 'none';
        pauseBtn.style.display = 'none';

        this.breakInterval = setInterval(() => {
            breakTime--;

            if (breakTime < 0) {
                clearInterval(this.breakInterval);
                breakIndicator.style.display = 'none';
                this.isBreak = false;
                sessionStorage.removeItem('timerSeconds');
                this.updateTimerDisplay(1500);
                startBtn.style.display = 'block';
                this.playSound();
                this.showNotification('Break time over! Ready to focus? 💪', 'success');
                return;
            }

            const minutes = Math.floor(breakTime / 60);
            const secs = breakTime % 60;
            const breakDisplay = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
            document.getElementById('breakTime').textContent = breakDisplay;
        }, 1000);
    }

    playSound() {
        // Create a simple beep sound using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gain.gain.setValueAtTime(0.3, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }

    // ==================== TASK MANAGEMENT ====================
    addTask() {
        const input = document.getElementById('taskInput');
        const taskText = input.value.trim();

        if (!taskText) {
            this.showNotification('Please enter a task', 'error');
            return;
        }

        const task = {
            id: Date.now(),
            text: taskText,
            completed: false
        };

        this.data.tasks.push(task);
        this.saveData();
        input.value = '';
        this.renderTasks();
        this.showNotification('Task added! 📝', 'success');
    }

    toggleTask(taskId) {
        const task = this.data.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            if (task.completed) {
                this.data.tasksCompleted += 1;
            } else {
                this.data.tasksCompleted = Math.max(0, this.data.tasksCompleted - 1);
            }
            this.saveData();
            this.renderTasks();
            this.updateUI();
        }
    }

    deleteTask(taskId) {
        const task = this.data.tasks.find(t => t.id === taskId);
        if (task && task.completed) {
            this.data.tasksCompleted = Math.max(0, this.data.tasksCompleted - 1);
        }
        this.data.tasks = this.data.tasks.filter(t => t.id !== taskId);
        this.saveData();
        this.renderTasks();
        this.updateUI();
        this.showNotification('Task deleted', 'success');
    }

    editTask(taskId) {
        const task = this.data.tasks.find(t => t.id === taskId);
        if (task) {
            this.currentEditingTaskId = taskId;
            document.getElementById('editTaskInput').value = task.text;
            document.getElementById('editModal').classList.add('active');
            document.getElementById('editTaskInput').focus();
        }
    }

    saveEditTask() {
        const input = document.getElementById('editTaskInput');
        const newText = input.value.trim();

        if (!newText) {
            this.showNotification('Task cannot be empty', 'error');
            return;
        }

        const task = this.data.tasks.find(t => t.id === this.currentEditingTaskId);
        if (task) {
            task.text = newText;
            this.saveData();
            this.renderTasks();
            this.closeEditModal();
            this.showNotification('Task updated! ✏️', 'success');
        }
    }

    closeEditModal() {
        document.getElementById('editModal').classList.remove('active');
        this.currentEditingTaskId = null;
    }

    renderTasks() {
        const tasksList = document.getElementById('tasksList');

        if (this.data.tasks.length === 0) {
            tasksList.innerHTML = '<p class="no-tasks">No tasks yet. Add one to get started!</p>';
            return;
        }

        tasksList.innerHTML = this.data.tasks.map(task => `
            <div class="task-item ${task.completed ? 'completed' : ''}">
                <button class="task-checkbox ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                    ${task.completed ? '✓' : ''}
                </button>
                <span class="task-text">${this.escapeHtml(task.text)}</span>
                <div class="task-actions">
                    <button class="task-btn edit-btn" data-id="${task.id}">✏️</button>
                    <button class="task-btn delete-btn" data-id="${task.id}">🗑️</button>
                </div>
            </div>
        `).join('');

        // Attach event listeners
        tasksList.querySelectorAll('.task-checkbox').forEach(btn => {
            btn.addEventListener('click', () => this.toggleTask(parseInt(btn.dataset.id)));
        });

        tasksList.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => this.editTask(parseInt(btn.dataset.id)));
        });

        tasksList.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => this.deleteTask(parseInt(btn.dataset.id)));
        });
    }

    // ==================== UI UPDATES ====================
    updateUI() {
        // Dashboard
        document.getElementById('streakCounter').textContent = this.data.streak;
        document.getElementById('focusTimeDisplay').textContent = this.data.focusTime;
        document.getElementById('sessionsDisplay').textContent = this.data.sessions;

        // Last updated
        if (this.data.lastActivityDate) {
            const lastDate = new Date(this.data.lastActivityDate);
            document.getElementById('lastUpdated').textContent = `Last activity: ${lastDate.toLocaleDateString()}`;
        }

        // Focus page
        document.getElementById('tasksCompletedDisplay').textContent = this.data.tasksCompleted;
        document.getElementById('focusSessionsDisplay').textContent = this.data.sessions;

        // Tasks page
        this.renderTasks();
        this.updateProgressBar();
    }

    updateProgressBar() {
        const total = this.data.tasks.length;
        const completed = this.data.tasks.filter(t => t.completed).length;
        const percentage = total === 0 ? 0 : (completed / total) * 100;

        document.getElementById('progressBar').style.width = percentage + '%';
        document.getElementById('progressText').textContent = `${completed} / ${total} Tasks Completed`;
    }

    // ==================== NOTIFICATIONS ====================
    showNotification(message, type = 'success') {
        const container = document.getElementById('notificationContainer');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `<p class="notification-text">${message}</p>`;

        container.appendChild(notification);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// ==================== INITIALIZATION ====================
const app = new DevMomentumApp();

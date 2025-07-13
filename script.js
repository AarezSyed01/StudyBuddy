/**
 * Student Study Organiser - Main JavaScript File
 * Handles all functionality including tasks, timer, music, and notes
 */

// Application State Management
class StudyOrganiser {
    constructor() {
        this.currentSection = 'dashboard';
        this.currentTaskId = null;
        this.currentNoteId = null;
        this.timer = {
            isRunning: false,
            mode: 'study', // 'study' or 'break'
            timeLeft: 25 * 60, // 25 minutes in seconds
            totalTime: 25 * 60,
            intervalId: null,
            studyDuration: 25, // minutes
            breakDuration: 5   // minutes
        };
        this.music = {
            currentTrack: 0,
            isPlaying: false,
            tracks: [
                { title: 'Calm Forest', file: 'audio/Relaxing Music with Nature Sounds, Forest Music, Sleep Music, Meditation Music [Nd7e4SNjGBM].mp3' },
                { title: 'Focus Music', file: 'audio/Study Music Alpha Waves_ Relaxing Studying Music, Brain Power, Focus Concentration Music, ☯161 [WPni755-Krg].mp3' },
                { title: 'Rain Sounds', file: 'audio/Rooftop Study Room with Rain Sounds - Ambience for Studying, Relaxing [Jvgx5HHJ0qw].mp3' },

                { title: 'Break Chill Music', file: 'audio/Best of Arijit Singh Mashup 2024 _ AMEET Mashup _ Arijit Singh Love Songs _ Best of Love Songs 2024 [c92tUshrZ9g].mp3' }


            ]
        };
        this.motivationalQuotes = [
            "Success is the sum of small efforts repeated day in and day out.",
            "The expert in anything was once a beginner.",
            "Don't put off tomorrow what you can do today.",
            "Education is the most powerful weapon which you can use to change the world.",
            "The beautiful thing about learning is that no one can take it away from you.",
            "Believe you can and you're halfway there.",
            "Success is not final, failure is not fatal: it is the courage to continue that counts.",
            "The only way to do great work is to love what you do.",
            "Your limitation—it's only your imagination.",
            "Push yourself, because no one else is going to do it for you."
        ];
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadData();
        this.showMotivationalQuote();
        this.updateDashboard();
        this.setupMusicPlayer();
        this.updateTimer();
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchSection(e.target.dataset.section);
            });
        });

        // Task Management
        class TaskManager {
            constructor() {
                this.tasks = [];
        
                // Event Listeners
                document.getElementById('add-task-btn').addEventListener('click', () => this.openTaskModal());
                document.getElementById('task-form').addEventListener('submit', (e) => this.saveTask(e));
                document.getElementById('cancel-task').addEventListener('click', () => this.closeTaskModal());
                document.getElementById('subject-filter').addEventListener('change', () => this.renderTasks());
                document.getElementById('status-filter').addEventListener('change', () => this.renderTasks());
            }
        
            openTaskModal() {
                document.getElementById('task-modal').style.display = 'block';
            }
        
            closeTaskModal() {
                document.getElementById('task-modal').style.display = 'none';
                document.getElementById('task-form').reset();
            }
        
            saveTask(e) {
                e.preventDefault();
        
                const title = document.getElementById('task-title').value;
                const subject = document.getElementById('task-subject').value;
                const status = document.getElementById('task-status').value;
        
                if (title.trim() === "") return;
        
                this.tasks.push({ title, subject, status });
                this.renderTasks();
                this.closeTaskModal();
            }
        
            renderTasks() {
                const list = document.getElementById('tasks-list');
                const subjectFilter = document.getElementById('subject-filter').value;
                const statusFilter = document.getElementById('status-filter').value;
        
                let filteredTasks = this.tasks.filter(task => {
                    return (subjectFilter === "" || task.subject === subjectFilter) &&
                           (statusFilter === "" || task.status === statusFilter);
                });
        
                list.innerHTML = filteredTasks.length > 0 ? "" : `<p class="empty-state">No tasks found. Add your first task!</p>`;
        
                filteredTasks.forEach((task, index) => {
                    const el = document.createElement("div");
                    el.className = "task-item";
                    el.innerHTML = `
                        <div class="task-details">
                            <p><strong>${task.title}</strong> <em>(${task.subject})</em></p>
                            <p>Status: ${task.status}</p>
                        </div>
                    `;
                    list.appendChild(el);
                });
            }
        }
        
        const taskManager = new TaskManager();
        

        
        // Timer
        document.getElementById('timer-start').addEventListener('click', () => this.startTimer());
        document.getElementById('timer-pause').addEventListener('click', () => this.pauseTimer());
        document.getElementById('timer-reset').addEventListener('click', () => this.resetTimer());
        document.getElementById('apply-settings').addEventListener('click', () => this.applyTimerSettings());

        // Music Player
        document.getElementById('play-pause').addEventListener('click', () => this.toggleMusic());
        document.getElementById('prev-track').addEventListener('click', () => this.previousTrack());
        document.getElementById('next-track').addEventListener('click', () => this.nextTrack());
        document.getElementById('volume-slider').addEventListener('input', (e) => this.setVolume(e.target.value));
        
        // Track selection
        document.querySelectorAll('.track-item').forEach((item, index) => {
            item.addEventListener('click', () => this.selectTrack(index));
        });

        // Notes
        document.getElementById('add-note-btn').addEventListener('click', () => this.openNoteModal());
        document.getElementById('note-form').addEventListener('submit', (e) => this.saveNote(e));
        document.getElementById('cancel-note').addEventListener('click', () => this.closeNoteModal());
        document.getElementById('notes-search').addEventListener('input', (e) => this.searchNotes(e.target.value));

        // Modal close buttons
        document.querySelectorAll('.close').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeTaskModal();
                this.closeNoteModal();
            });
        });

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeTaskModal();
                this.closeNoteModal();
            }
        });
    }

    // Data Management
    async loadData() {
        try {
            // Load tasks from API
            const tasksResponse = await fetch('/api/tasks');
            this.tasks = await tasksResponse.json();

            // Load notes from API
            const notesResponse = await fetch('/api/notes');
            this.notes = await notesResponse.json();

            // Load timer settings from API
            const settingsResponse = await fetch('/api/timer/settings');
            const savedSettings = await settingsResponse.json();
            if (savedSettings) {
                this.timer.studyDuration = savedSettings.studyDuration || 25;
                this.timer.breakDuration = savedSettings.breakDuration || 5;
            } else {
                // Use default values if no settings exist
                this.timer.studyDuration = 25;
                this.timer.breakDuration = 5;
            }
            
            // Update input fields with saved settings
            document.getElementById('study-duration').value = this.timer.studyDuration;
            document.getElementById('break-duration').value = this.timer.breakDuration;
            
            // Set initial timer time based on current mode
            if (this.timer.mode === 'study') {
                this.timer.timeLeft = this.timer.studyDuration * 60;
                this.timer.totalTime = this.timer.studyDuration * 60;
            } else {
                this.timer.timeLeft = this.timer.breakDuration * 60;
                this.timer.totalTime = this.timer.breakDuration * 60;
            }

            // Load timer sessions for today
            const today = new Date().toISOString().split('T')[0];
            const sessionsResponse = await fetch(`/api/timer/sessions?date=${today}`);
            const sessions = await sessionsResponse.json();
            
            // Calculate daily stats
            this.timerStats = {
                sessionsToday: sessions.filter(s => s.mode === 'study').length,
                totalStudyTime: sessions
                    .filter(s => s.mode === 'study')
                    .reduce((total, s) => total + s.duration, 0),
                lastDate: today
            };
        } catch (error) {
            console.error('Error loading data:', error);
            // Fallback to localStorage for now
            this.tasks = JSON.parse(localStorage.getItem('study-tasks') || '[]');
            this.notes = JSON.parse(localStorage.getItem('study-notes') || '[]');
            this.timerStats = JSON.parse(localStorage.getItem('timer-stats') || '{"sessionsToday": 0, "totalStudyTime": 0, "lastDate": ""}');
        }
    }

    async saveData() {
        // Data is now saved via API calls, no need for localStorage
        // Individual methods handle their own API calls
    }

    async saveTimerStats() {
        // Timer stats are calculated from database sessions, no need to save separately
    }

    // Navigation
    switchSection(section) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-section="${section}"]`).classList.add('active');

        // Update sections
        document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
        document.getElementById(section).classList.add('active');

        this.currentSection = section;

        // Update content based on section
        if (section === 'dashboard') {
            this.updateDashboard();
        } else if (section === 'tasks') {
            this.renderTasks();
            this.populateSubjectFilter();
        } else if (section === 'notes') {
            this.renderNotes();
        }
    }

    // Motivational Quotes
    showMotivationalQuote() {
        const randomQuote = this.motivationalQuotes[Math.floor(Math.random() * this.motivationalQuotes.length)];
        document.getElementById('motivational-quote').textContent = randomQuote;
    }

    // Dashboard Functions
    updateDashboard() {
        this.updateTodayTasks();
        this.updateUpcomingExams();
        this.updateDailyStudyTime();
    }

    updateTodayTasks() {
        const today = new Date().toDateString();
        const todayTasks = this.tasks.filter(task => {
            const taskDate = new Date(task.dueDate).toDateString();
            return taskDate === today;
        });

        const container = document.getElementById('today-tasks');
        if (todayTasks.length === 0) {
            container.innerHTML = '<p class="empty-state">No tasks for today</p>';
        } else {
            container.innerHTML = todayTasks.map(task => `
                <div class="task-item-mini ${task.completed ? 'completed' : ''}">
                    <strong>${task.title}</strong>
                    <div class="task-meta">
                        <span><i class="fas fa-book"></i> ${task.subject}</span>
                        <span><i class="fas fa-clock"></i> ${this.formatDate(task.dueDate)}</span>
                    </div>
                </div>
            `).join('');
        }
    }

    updateUpcomingExams() {
        const now = new Date();
        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        const upcomingExams = this.tasks.filter(task => {
            const taskDate = new Date(task.dueDate);
            return task.isExam && taskDate >= now && taskDate <= weekFromNow;
        });

        const container = document.getElementById('upcoming-exams');
        if (upcomingExams.length === 0) {
            container.innerHTML = '<p class="empty-state">No upcoming exams</p>';
        } else {
            container.innerHTML = upcomingExams.map(exam => `
                <div class="exam-item">
                    <strong>${exam.title}</strong>
                    <div class="task-meta">
                        <span><i class="fas fa-book"></i> ${exam.subject}</span>
                        <span><i class="fas fa-calendar"></i> ${this.formatDate(exam.dueDate)}</span>
                    </div>
                </div>
            `).join('');
        }
    }

    updateDailyStudyTime() {
        const hours = Math.floor(this.timerStats.totalStudyTime / 60);
        const minutes = this.timerStats.totalStudyTime % 60;
        document.getElementById('daily-study-time').innerHTML = 
            `<span class="time-display">${hours}h ${minutes}m</span>`;
    }

    // Task Management
    openTaskModal(taskId = null) {
        this.currentTaskId = taskId;
        const modal = document.getElementById('task-modal');
        const form = document.getElementById('task-form');
        
        if (taskId) {
            const task = this.tasks.find(t => t.id === taskId);
            document.getElementById('modal-title').textContent = 'Edit Task';
            document.getElementById('task-title').value = task.title;
            document.getElementById('task-description').value = task.description;
            document.getElementById('task-subject').value = task.subject;
            document.getElementById('task-due-date').value = task.dueDate;
            document.getElementById('task-is-exam').checked = task.isExam;
        } else {
            document.getElementById('modal-title').textContent = 'Add Task';
            form.reset();
        }
        
        modal.style.display = 'block';
    }

    closeTaskModal() {
        document.getElementById('task-modal').style.display = 'none';
        this.currentTaskId = null;
    }

    async saveTask(e) {
        e.preventDefault();
        
        const formData = {
            title: document.getElementById('task-title').value,
            description: document.getElementById('task-description').value,
            subject: document.getElementById('task-subject').value,
            dueDate: document.getElementById('task-due-date').value,
            isExam: document.getElementById('task-is-exam').checked
        };

        try {
            if (this.currentTaskId) {
                // Edit existing task
                await fetch(`/api/tasks/${this.currentTaskId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData),
                });
            } else {
                // Add new task
                await fetch('/api/tasks', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData),
                });
            }

            await this.loadData();
            this.closeTaskModal();
            this.renderTasks();
            this.updateDashboard();
        } catch (error) {
            console.error('Error saving task:', error);
            alert('Failed to save task. Please try again.');
        }
    }

    async deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            try {
                await fetch(`/api/tasks/${taskId}`, {
                    method: 'DELETE',
                });
                await this.loadData();
                this.renderTasks();
                this.updateDashboard();
            } catch (error) {
                console.error('Error deleting task:', error);
                alert('Failed to delete task. Please try again.');
            }
        }
    }

    async toggleTaskComplete(taskId) {
        try {
            const task = this.tasks.find(t => t.id === parseInt(taskId));
            await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ completed: !task.completed }),
            });
            await this.loadData();
            this.renderTasks();
            this.updateDashboard();
        } catch (error) {
            console.error('Error updating task:', error);
            alert('Failed to update task. Please try again.');
        }
    }

    renderTasks() {
        const subjectFilter = document.getElementById('subject-filter').value;
        const statusFilter = document.getElementById('status-filter').value;
        
        let filteredTasks = this.tasks;
        
        if (subjectFilter) {
            filteredTasks = filteredTasks.filter(task => task.subject === subjectFilter);
        }
        
        if (statusFilter === 'pending') {
            filteredTasks = filteredTasks.filter(task => !task.completed);
        } else if (statusFilter === 'completed') {
            filteredTasks = filteredTasks.filter(task => task.completed);
        }

        const container = document.getElementById('tasks-list');
        
        if (filteredTasks.length === 0) {
            container.innerHTML = '<p class="empty-state">No tasks found. Add your first task!</p>';
        } else {
            container.innerHTML = filteredTasks.map(task => {
                const isOverdue = new Date(task.dueDate) < new Date() && !task.completed;
                return `
                    <div class="task-item ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}">
                        <div class="task-header">
                            <h3 class="task-title ${task.completed ? 'completed' : ''}">${task.title}</h3>
                            <div class="task-actions">
                                <button class="btn-small btn-complete" onclick="app.toggleTaskComplete('${task.id}')">
                                    <i class="fas fa-${task.completed ? 'undo' : 'check'}"></i>
                                </button>
                                <button class="btn-small btn-edit" onclick="app.openTaskModal('${task.id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn-small btn-delete" onclick="app.deleteTask('${task.id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        <div class="task-description">${task.description}</div>
                        <div class="task-meta">
                            <span><i class="fas fa-book"></i> ${task.subject}</span>
                            <span><i class="fas fa-calendar"></i> ${this.formatDate(task.dueDate)}</span>
                            ${task.isExam ? '<span class="task-badge exam-badge">Exam</span>' : ''}
                            ${isOverdue ? '<span class="task-badge" style="background: rgba(244, 67, 54, 0.2); color: #f44336;">Overdue</span>' : ''}
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    populateSubjectFilter() {
        const subjects = [...new Set(this.tasks.map(task => task.subject))];
        const filter = document.getElementById('subject-filter');
        filter.innerHTML = '<option value="">All Subjects</option>';
        subjects.forEach(subject => {
            filter.innerHTML += `<option value="${subject}">${subject}</option>`;
        });
    }

    // Timer Functions
    startTimer() {
        this.timer.isRunning = true;
        document.getElementById('timer-start').disabled = true;
        document.getElementById('timer-pause').disabled = false;
        
        this.timer.intervalId = setInterval(() => {
            this.timer.timeLeft--;
            this.updateTimerDisplay();
            
            if (this.timer.timeLeft <= 0) {
                this.completeTimerSession();
            }
        }, 1000);
    }

    pauseTimer() {
        this.timer.isRunning = false;
        clearInterval(this.timer.intervalId);
        document.getElementById('timer-start').disabled = false;
        document.getElementById('timer-pause').disabled = true;
    }

    resetTimer() {
        this.pauseTimer();
        this.timer.timeLeft = this.timer.totalTime;
        this.updateTimerDisplay();
    }

    async applyTimerSettings() {
        const studyDuration = parseInt(document.getElementById('study-duration').value);
        const breakDuration = parseInt(document.getElementById('break-duration').value);
        
        if (studyDuration < 1 || studyDuration > 120 || breakDuration < 1 || breakDuration > 60) {
            alert('Please enter valid durations (Study: 1-120 minutes, Break: 1-60 minutes)');
            return;
        }
        
        try {
            // Stop timer if running
            if (this.timer.isRunning) {
                this.pauseTimer();
            }
            
            // Update timer settings
            this.timer.studyDuration = studyDuration;
            this.timer.breakDuration = breakDuration;
            
            // Save settings to API
            await fetch('/api/timer/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    studyDuration: this.timer.studyDuration,
                    breakDuration: this.timer.breakDuration
                }),
            });
            
            // Reset timer with new duration
            if (this.timer.mode === 'study') {
                this.timer.timeLeft = this.timer.studyDuration * 60;
                this.timer.totalTime = this.timer.studyDuration * 60;
            } else {
                this.timer.timeLeft = this.timer.breakDuration * 60;
                this.timer.totalTime = this.timer.breakDuration * 60;
            }
            
            this.updateTimerDisplay();
            this.showNotification('Settings Applied', `Study: ${studyDuration}min, Break: ${breakDuration}min`);
        } catch (error) {
            console.error('Error saving timer settings:', error);
            alert('Failed to save timer settings. Please try again.');
        }
    }

    async completeTimerSession() {
        this.pauseTimer();
        
        try {
            if (this.timer.mode === 'study') {
                // Save completed study session to database
                await fetch('/api/timer/sessions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        mode: 'study',
                        duration: this.timer.studyDuration,
                        date: new Date().toISOString().split('T')[0]
                    }),
                });
                
                // Update stats
                this.timerStats.sessionsToday++;
                this.timerStats.totalStudyTime += this.timer.studyDuration;
                this.timer.mode = 'break';
                this.timer.timeLeft = this.timer.breakDuration * 60;
                this.timer.totalTime = this.timer.breakDuration * 60;
                
                this.showNotification('Study session complete!', `Time for a ${this.timer.breakDuration}-minute break.`);
            } else {
                // Save completed break session to database
                await fetch('/api/timer/sessions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        mode: 'break',
                        duration: this.timer.breakDuration,
                        date: new Date().toISOString().split('T')[0]
                    }),
                });
                
                // Completed break session
                this.timer.mode = 'study';
                this.timer.timeLeft = this.timer.studyDuration * 60;
                this.timer.totalTime = this.timer.studyDuration * 60;
                
                this.showNotification('Break time over!', 'Ready for another study session?');
            }
            
            this.updateTimerDisplay();
            this.updateDashboard();
            this.updateTimerStats();
        } catch (error) {
            console.error('Error saving timer session:', error);
        }
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timer.timeLeft / 60);
        const seconds = this.timer.timeLeft % 60;
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        document.getElementById('timer-time').textContent = timeString;
        document.getElementById('timer-mode').textContent = this.timer.mode === 'study' ? 'Study' : 'Break';
        
        // Update progress circle
        const progress = ((this.timer.totalTime - this.timer.timeLeft) / this.timer.totalTime) * 565.48;
        document.getElementById('progress-circle').style.strokeDashoffset = 565.48 - progress;
        
        // Change colors based on mode
        const progressCircle = document.getElementById('progress-circle');
        if (this.timer.mode === 'study') {
            progressCircle.style.stroke = '#4fc3f7';
        } else {
            progressCircle.style.stroke = '#81c784';
        }
    }

    updateTimerStats() {
        document.getElementById('sessions-today').textContent = this.timerStats.sessionsToday;
        const hours = Math.floor(this.timerStats.totalStudyTime / 60);
        const minutes = this.timerStats.totalStudyTime % 60;
        document.getElementById('total-study-time').textContent = `${hours}h ${minutes}m`;
    }

    updateTimer() {
        this.updateTimerDisplay();
        this.updateTimerStats();
    }

    showNotification(title, message) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body: message });
        } else if ('Notification' in window && Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification(title, { body: message });
                }
            });
        } else {
            // Fallback: show alert
            alert(`${title}\n${message}`);
        }
    }

    // Music Player Functions
    setupMusicPlayer() {
        this.audioPlayer = document.getElementById('audio-player');
        this.audioPlayer.volume = 0.5;
        
        // Audio event listeners
        this.audioPlayer.addEventListener('loadedmetadata', () => this.updateAudioDisplay());
        this.audioPlayer.addEventListener('timeupdate', () => this.updateProgress());
        this.audioPlayer.addEventListener('ended', () => this.nextTrack());
        
        // Progress bar click
        document.querySelector('.progress-bar').addEventListener('click', (e) => {
            const rect = e.target.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            this.audioPlayer.currentTime = percent * this.audioPlayer.duration;
        });
        
        this.selectTrack(0);
    }

    selectTrack(index) {
        this.music.currentTrack = index;
        const track = this.music.tracks[index];
        
        // Update UI
        document.getElementById('track-title').textContent = track.title;
        document.querySelectorAll('.track-item').forEach((item, i) => {
            item.classList.toggle('active', i === index);
        });
        
        // Load audio
        this.audioPlayer.src = track.file;
        this.audioPlayer.load();
        
        if (this.music.isPlaying) {
            this.audioPlayer.play().catch(() => {
                // Handle autoplay restrictions
                this.music.isPlaying = false;
                this.updatePlayButton();
            });
        }
    }

    toggleMusic() {
        if (this.music.isPlaying) {
            this.audioPlayer.pause();
            this.music.isPlaying = false;
            this.updatePlayButton(); // Moved here
        } else {
            this.audioPlayer.play()
                .then(() => {
                    this.music.isPlaying = true;
                    this.updatePlayButton(); // Moved inside .then()
                })
                .catch(() => {
                    console.log('Audio playback failed');
                });
        }
    }
    

    previousTrack() {
        const newIndex = this.music.currentTrack > 0 ? 
            this.music.currentTrack - 1 : 
            this.music.tracks.length - 1;
        this.selectTrack(newIndex);
    }

    nextTrack() {
        const newIndex = this.music.currentTrack < this.music.tracks.length - 1 ? 
            this.music.currentTrack + 1 : 
            0;
        this.selectTrack(newIndex);
    }

    setVolume(value) {
        this.audioPlayer.volume = value / 100;
    }

    updatePlayButton() {
        const playButton = document.getElementById('play-pause');
        const icon = playButton.querySelector('i');
        icon.className = this.music.isPlaying ? 'fas fa-pause' : 'fas fa-play';
    }

    updateAudioDisplay() {
        document.getElementById('duration').textContent = this.formatTime(this.audioPlayer.duration);
    }

    updateProgress() {
        const progress = (this.audioPlayer.currentTime / this.audioPlayer.duration) * 100;
        document.getElementById('progress').style.width = `${progress}%`;
        document.getElementById('current-time').textContent = this.formatTime(this.audioPlayer.currentTime);
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // Notes Management
    openNoteModal(noteId = null) {
        this.currentNoteId = noteId;
        const modal = document.getElementById('note-modal');
        const form = document.getElementById('note-form');
        
        if (noteId) {
            const note = this.notes.find(n => n.id === noteId);
            document.getElementById('note-modal-title').textContent = 'Edit Note';
            document.getElementById('note-title').value = note.title;
            document.getElementById('note-content').value = note.content;
        } else {
            document.getElementById('note-modal-title').textContent = 'Add Note';
            form.reset();
        }
        
        modal.style.display = 'block';
    }

    closeNoteModal() {
        document.getElementById('note-modal').style.display = 'none';
        this.currentNoteId = null;
    }

    async saveNote(e) {
        e.preventDefault();
        
        const formData = {
            title: document.getElementById('note-title').value,
            content: document.getElementById('note-content').value
        };

        try {
            if (this.currentNoteId) {
                // Edit existing note
                await fetch(`/api/notes/${this.currentNoteId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData),
                });
            } else {
                // Add new note
                await fetch('/api/notes', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData),
                });
            }

            await this.loadData();
            this.closeNoteModal();
            this.renderNotes();
        } catch (error) {
            console.error('Error saving note:', error);
            alert('Failed to save note. Please try again.');
        }
    }

    async deleteNote(noteId) {
        if (confirm('Are you sure you want to delete this note?')) {
            try {
                await fetch(`/api/notes/${noteId}`, {
                    method: 'DELETE',
                });
                await this.loadData();
                this.renderNotes();
            } catch (error) {
                console.error('Error deleting note:', error);
                alert('Failed to delete note. Please try again.');
            }
        }
    }

    async searchNotes(query) {
        if (query.trim()) {
            try {
                const response = await fetch(`/api/notes?search=${encodeURIComponent(query)}`);
                const searchResults = await response.json();
                this.renderNotes(query, searchResults);
            } catch (error) {
                console.error('Error searching notes:', error);
                this.renderNotes(query);
            }
        } else {
            this.renderNotes();
        }
    }

    renderNotes(searchQuery = '', searchResults = null) {
        let filteredNotes = searchResults || this.notes;
        
        if (searchQuery && !searchResults) {
            filteredNotes = (this.notes || []).filter(note => 
                note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                note.content.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        const container = document.getElementById('notes-list');
        
        if (filteredNotes.length === 0) {
            container.innerHTML = '<p class="empty-state">No notes found. Create your first note!</p>';
        } else {
            container.innerHTML = filteredNotes.map(note => `
                <div class="note-item">
                    <div class="note-header">
                        <h3 class="note-title">${note.title}</h3>
                        <div class="note-actions">
                            <button class="btn-small btn-edit" onclick="app.openNoteModal('${note.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-small btn-delete" onclick="app.deleteNote('${note.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="note-content">${note.content.substring(0, 200)}${note.content.length > 200 ? '...' : ''}</div>
                    <div class="note-date">
                        ${note.updatedAt !== note.createdAt ? 'Updated' : 'Created'}: ${this.formatDate(note.updatedAt)}
                    </div>
                </div>
            `).join('');
        }
    }

    // Utility Functions
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }
}

// Initialize the application
const app = new StudyOrganiser();

// Request notification permission on load
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

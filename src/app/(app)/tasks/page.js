'use client';

import { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { useApp } from '@/context/AppContext';
import TaskModal from '@/components/dashboard/TaskModal';
import EventModal from '@/components/dashboard/EventModal';
import { TasksSkeleton } from '@/components/layout/SkeletonLoader';
import styles from './tasks.module.css';

export default function TasksPage() {
  const { tasks, toggleTask, toggleSubtask, deleteTask, loading } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  
  if (loading) {
    return (
      <>
        <PageHeader title="Tasks" />
        <div className="page-content">
          <TasksSkeleton />
        </div>
      </>
    );
  }
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, TODO, DONE
  const [priorityFilter, setPriorityFilter] = useState('ALL'); // ALL, HIGH, MEDIUM, LOW
  const [categoryFilter, setCategoryFilter] = useState('ALL'); // ALL, Work, Study, Personal, Health, Finance
  
  // Expanded tasks state (for subtasks list)
  const [expandedTasks, setExpandedTasks] = useState({});

  const toggleExpand = (id) => {
    setExpandedTasks((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleEditTask = (task, e) => {
    e.stopPropagation();
    setTaskToEdit(task);
    setModalOpen(true);
  };

  const handleDeleteTask = (id, e) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask(id);
    }
  };

  const handleOpenNewTaskModal = () => {
    setTaskToEdit(null);
    setModalOpen(true);
  };

  // Filter logic
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'TODO'
        ? !task.done
        : task.done;
    const matchesPriority =
      priorityFilter === 'ALL' ? true : task.priority === priorityFilter;
    const matchesCategory =
      categoryFilter === 'ALL' ? true : task.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  return (
    <>
      <PageHeader
        title="Tasks"
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={() => setEventModalOpen(true)}>
              + New Meeting
            </button>
            <button className="btn btn-primary" onClick={handleOpenNewTaskModal}>
              + New Task
            </button>
          </div>
        }
      />

      <div className={`page-content ${styles.tasksPage}`}>
        {/* Filters Top Bar */}
        <div className={`glass-card ${styles.filtersCard} page-enter`}>
          <div className={styles.searchRow}>
            <input
              type="text"
              placeholder="🔍 Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          
          <div className={styles.filterOptions}>
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Status:</span>
              <div className={styles.pillGroup}>
                {['ALL', 'TODO', 'DONE'].map((s) => (
                  <button
                    key={s}
                    className={`${styles.pill} ${statusFilter === s ? styles.pillActive : ''}`}
                    onClick={() => setStatusFilter(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Priority:</span>
              <div className={styles.pillGroup}>
                {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
                  <button
                    key={p}
                    className={`${styles.pill} ${priorityFilter === p ? styles.pillActive : ''}`}
                    onClick={() => setPriorityFilter(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={styles.selectFilter}
              >
                <option value="ALL">All Categories</option>
                <option value="Work">Work</option>
                <option value="Study">Study</option>
                <option value="Personal">Personal</option>
                <option value="Health">Health</option>
                <option value="Finance">Finance</option>
              </select>
            </div>
          </div>
        </div>

        {/* Task List Grid */}
        <div className={`${styles.taskList} stagger-children`}>
          {filteredTasks.length === 0 ? (
            <div className={`glass-card ${styles.emptyState} page-enter`}>
              <div className={styles.emptyIcon}>📝</div>
              <h3>No tasks found</h3>
              <p>Try resetting your filters or create a new task.</p>
              <button className="btn btn-secondary btn-sm" onClick={handleOpenNewTaskModal}>
                Create Task
              </button>
            </div>
          ) : (
            filteredTasks.map((task, index) => {
              const totalSub = task.subtasks?.length || 0;
              const completedSub = task.subtasks?.filter((st) => st.done).length || 0;
              const isExpanded = expandedTasks[task.id];

              return (
                <div
                  key={task.id}
                  className={`glass-card ${styles.taskCard} ${task.done ? styles.taskDone : ''} page-enter`}
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => toggleExpand(task.id)}
                >
                  <div className={styles.taskHeader}>
                    {/* Checkbox */}
                    <div
                      className={styles.taskCheck}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTask(task.id);
                      }}
                    >
                      <div className={`${styles.checkbox} ${task.done ? styles.checked : ''}`}>
                        {task.done && '✓'}
                      </div>
                    </div>

                    {/* Marker */}
                    <div className={styles.taskMarker}>
                      {task.marker.type === 'EMOJI' ? (
                        <span>{task.marker.value}</span>
                      ) : (
                        <span
                          className={styles.colorDot}
                          style={{ background: task.marker.value }}
                        />
                      )}
                    </div>

                    {/* Info */}
                    <div className={styles.taskInfo}>
                      <h3 className={styles.taskTitle}>{task.title}</h3>
                      <div className={styles.taskMeta}>
                        <span className={styles.metaItem}>📅 {task.dueDate || 'No Date'}</span>
                        {task.dueTime && <span className={styles.metaItem}>⏰ {task.dueTime}</span>}
                        <span className={styles.metaItem}>💼 {task.category}</span>
                        {totalSub > 0 && (
                          <span className={styles.metaItem}>
                            📋 {completedSub}/{totalSub} subtasks
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Badge & Actions */}
                    <div className={styles.taskRight} onClick={(e) => e.stopPropagation()}>
                      <span className={`badge ${
                        task.priority === 'HIGH' ? 'badge-rose' :
                        task.priority === 'MEDIUM' ? 'badge-amber' : 'badge-blue'
                      }`}>
                        {task.priority}
                      </span>
                      <div className={styles.taskActions}>
                        <button
                          className={styles.actionBtn}
                          onClick={(e) => handleEditTask(task, e)}
                          title="Edit task"
                        >
                          ✏️
                        </button>
                        <button
                          className={styles.actionBtn}
                          onClick={(e) => handleDeleteTask(task.id, e)}
                          title="Delete task"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Subtask list (visible if expanded) */}
                  {totalSub > 0 && isExpanded && (
                    <div className={styles.subtaskWrapper} onClick={(e) => e.stopPropagation()}>
                      <div className={styles.subtaskTitleHeader}>Subtasks Checklist</div>
                      <div className={styles.subtaskGrid}>
                        {task.subtasks.map((st) => (
                          <div
                            key={st.id}
                            className={`${styles.subtaskItem} ${st.done ? styles.subtaskDone : ''}`}
                            onClick={() => toggleSubtask(task.id, st.id)}
                          >
                            <div className={`${styles.subCheckbox} ${st.done ? styles.subChecked : ''}`}>
                              {st.done && '✓'}
                            </div>
                            <span className={styles.subLabel}>{st.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Expand Indicator */}
                  {totalSub > 0 && (
                    <div className={styles.expandBar}>
                      <span>{isExpanded ? '▲ Hide subtasks' : '▼ View subtasks'}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Task Modal */}
      {modalOpen && (
        <TaskModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setTaskToEdit(null);
          }}
          taskToEdit={taskToEdit}
        />
      )}

      {/* Event Modal */}
      {eventModalOpen && (
        <EventModal
          isOpen={eventModalOpen}
          onClose={() => setEventModalOpen(false)}
        />
      )}
    </>
  );
}

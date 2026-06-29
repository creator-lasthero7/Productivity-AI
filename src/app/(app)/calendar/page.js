'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { useApp } from '@/context/AppContext';
import TaskModal from '@/components/dashboard/TaskModal';
import { CalendarSkeleton } from '@/components/layout/SkeletonLoader';
import styles from './calendar.module.css';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarPage() {
  const { tasks, events, loading } = useApp();
  
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 25)); // Locked to June 2026 for hackathon consistency, or use current date:
  
  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  const [currentView, setCurrentView] = useState('MONTH'); // MONTH, WEEK, DAY
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPreFilledDate, setModalPreFilledDate] = useState('');

  if (loading) {
    return (
      <>
        <PageHeader title="Calendar" />
        <div className="page-content">
          <CalendarSkeleton />
        </div>
      </>
    );
  }

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get calendar days for month view
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();
  
  // Previous month days to pad beginning
  const prevMonthDays = new Date(year, month, 0).getDate();
  const paddingDays = [];
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    paddingDays.push({
      day: prevMonthDays - i,
      month: month === 0 ? 11 : month - 1,
      year: month === 0 ? year - 1 : year,
      isCurrentMonth: false,
    });
  }

  // Current month days
  const currentDays = [];
  for (let i = 1; i <= daysInMonth; i++) {
    currentDays.push({
      day: i,
      month,
      year,
      isCurrentMonth: true,
    });
  }

  // Next month padding
  const totalSlots = 42; // 6 rows * 7 days
  const nextMonthPaddingCount = totalSlots - (paddingDays.length + currentDays.length);
  const nextDays = [];
  for (let i = 1; i <= nextMonthPaddingCount; i++) {
    nextDays.push({
      day: i,
      month: month === 11 ? 0 : month + 1,
      year: month === 11 ? year + 1 : year,
      isCurrentMonth: false,
    });
  }

  const allCalendarDays = [...paddingDays, ...currentDays, ...nextDays];

  // Helper: Format date to string key YYYY-MM-DD
  const formatDateKey = (y, m, d) => {
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  };

  // Navigate Months
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDayDoubleClick = (dayObj) => {
    const formatted = formatDateKey(dayObj.year, dayObj.month, dayObj.day);
    setModalPreFilledDate(formatted);
    setModalOpen(true);
  };

  const handleDayClick = (dayObj) => {
    setSelectedDate(new Date(dayObj.year, dayObj.month, dayObj.day));
  };

  // Filter Tasks and Events for a specific day
  const getDayItems = (y, m, d) => {
    const dateStr = formatDateKey(y, m, d);
    const dayTasks = tasks.filter((t) => t.dueDate === dateStr);
    const dayEvents = events.filter((e) => e.date === dateStr);
    return {
      tasks: dayTasks,
      events: dayEvents,
      all: [...dayTasks.map(t => ({ ...t, itemType: 'task' })), ...dayEvents.map(e => ({ ...e, itemType: 'event' }))]
    };
  };

  const isToday = (y, m, d) => {
    const today = new Date();
    return today.getDate() === d && today.getMonth() === m && today.getFullYear() === y;
  };

  const isSelected = (y, m, d) => {
    return selectedDate.getDate() === d && selectedDate.getMonth() === m && selectedDate.getFullYear() === y;
  };

  // Selected date key for Day/Week views
  const selectedDateKey = formatDateKey(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
  const selectedDayItems = getDayItems(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());

  return (
    <>
      <PageHeader
        title="Calendar"
        actions={
          <div className={styles.headerActions}>
            <div className={styles.viewToggles}>
              {['MONTH', 'WEEK', 'DAY'].map((v) => (
                <button
                  key={v}
                  className={`${styles.viewToggle} ${currentView === v ? styles.activeView : ''}`}
                  onClick={() => setCurrentView(v)}
                >
                  {v}
                </button>
              ))}
            </div>
            <button
              className="btn btn-primary"
              onClick={() => {
                setModalPreFilledDate(selectedDateKey);
                setModalOpen(true);
              }}
            >
              + Quick Schedule
            </button>
          </div>
        }
      />

      <div className={`page-content ${styles.calendarPage}`}>
        {/* Navigation Calendar Header */}
        <div className={`glass-card ${styles.calendarHeader} page-enter`}>
          <div className={styles.navControls}>
            <button className={styles.navBtn} onClick={prevMonth}>◀</button>
            <h2 className={styles.monthTitle}>
              {MONTH_NAMES[month]} <span>{year}</span>
            </h2>
            <button className={styles.navBtn} onClick={nextMonth}>▶</button>
          </div>
          <div className={styles.selectedDateBadge}>
            📍 Selected: {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </div>

        {/* --- MONTH VIEW --- */}
        {currentView === 'MONTH' && (
          <div className={`glass-card ${styles.monthGridCard} page-enter`}>
            <div className={styles.weekdaysHeader}>
              {WEEKDAY_NAMES.map((w) => (
                <div key={w} className={styles.weekdayCol}>
                  {w}
                </div>
              ))}
            </div>

            <div className={styles.daysGrid}>
              {allCalendarDays.map((dayObj, index) => {
                const dayItems = getDayItems(dayObj.year, dayObj.month, dayObj.day);
                const isDayToday = isToday(dayObj.year, dayObj.month, dayObj.day);
                const isDaySelected = isSelected(dayObj.year, dayObj.month, dayObj.day);

                return (
                  <div
                    key={index}
                    className={`${styles.dayCell} ${
                      !dayObj.isCurrentMonth ? styles.paddedCell : ''
                    } ${isDayToday ? styles.todayCell : ''} ${
                      isDaySelected ? styles.selectedCell : ''
                    }`}
                    onClick={() => handleDayClick(dayObj)}
                    onDoubleClick={() => handleDayDoubleClick(dayObj)}
                  >
                    <span className={styles.dayNum}>{dayObj.day}</span>
                    <div className={styles.cellItems}>
                      {dayItems.all.slice(0, 3).map((item, idx) => (
                        <div
                          key={idx}
                          className={`${styles.cellItem} ${item.done ? styles.cellItemDone : ''}`}
                        >
                          {item.itemType === 'task' ? (
                            <>
                              {item.marker.type === 'EMOJI' ? (
                                <span className={styles.markerMini}>{item.marker.value}</span>
                              ) : (
                                <span
                                  className={styles.colorMini}
                                  style={{ backgroundColor: item.marker.value }}
                                />
                              )}
                              <span className={styles.itemTitle}>{item.title}</span>
                            </>
                          ) : (
                            <>
                              <span className={styles.markerMini}>📅</span>
                              <span className={styles.itemTitle}>{item.title}</span>
                            </>
                          )}
                        </div>
                      ))}
                      {dayItems.all.length > 3 && (
                        <div className={styles.moreItemsBadge}>
                          +{dayItems.all.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- WEEK VIEW --- */}
        {currentView === 'WEEK' && (
          <div className={`${styles.weekViewContainer} stagger-children`}>
            {Array.from({ length: 7 }).map((_, idx) => {
              // Calculate date for each day of selected date's week
              const startOfWeek = new Date(selectedDate);
              const dayOfWeek = selectedDate.getDay();
              startOfWeek.setDate(selectedDate.getDate() - dayOfWeek + idx);
              
              const wY = startOfWeek.getFullYear();
              const wM = startOfWeek.getMonth();
              const wD = startOfWeek.getDate();
              const items = getDayItems(wY, wM, wD);
              const isWToday = isToday(wY, wM, wD);
              
              return (
                <div
                  key={idx}
                  className={`glass-card ${styles.weekDayCard} ${isWToday ? styles.todayWeekCard : ''} page-enter`}
                  onClick={() => setSelectedDate(new Date(wY, wM, wD))}
                >
                  <div className={styles.weekDayHeader}>
                    <div className={styles.weekDayName}>{WEEKDAY_NAMES[idx]}</div>
                    <div className={styles.weekDayNum}>{wD}</div>
                  </div>

                  <div className={styles.weekDayBody}>
                    {items.all.length === 0 ? (
                      <div className={styles.noWeekItems}>No tasks or events</div>
                    ) : (
                      items.all.map((item, id) => (
                        <div
                          key={id}
                          className={`${styles.weekItemCard} ${item.done ? styles.weekItemDone : ''}`}
                        >
                          <div className={styles.weekItemHeader}>
                            {item.itemType === 'task' ? (
                              <span className={`badge ${
                                item.priority === 'HIGH' ? 'badge-rose' :
                                item.priority === 'MEDIUM' ? 'badge-amber' : 'badge-blue'
                              }`}>
                                {item.priority}
                              </span>
                            ) : (
                              <span className="badge badge-purple">Event</span>
                            )}
                            <span className={styles.weekItemTime}>{item.dueTime || item.time || 'All Day'}</span>
                          </div>
                          <div className={styles.weekItemTitleRow}>
                            {item.itemType === 'task' ? (
                              item.marker.type === 'EMOJI' ? (
                                <span>{item.marker.value}</span>
                              ) : (
                                <span className={styles.colorDot} style={{ background: item.marker.value }} />
                              )
                            ) : (
                              <span>📅</span>
                            )}
                            <span className={styles.weekItemTitle}>{item.title}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* --- DAY VIEW --- */}
        {currentView === 'DAY' && (
          <div className={`glass-card ${styles.dayViewCard} page-enter`}>
            <div className={styles.dayViewGrid}>
              <div className={styles.daySummary}>
                <h3>Schedule Overview</h3>
                <p>You have {selectedDayItems.tasks.length} tasks and {selectedDayItems.events.length} meetings scheduled for today.</p>
              </div>

              <div className={styles.timelineList}>
                {['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'].map((hour) => {
                  const hourItems = selectedDayItems.all.filter(
                    item => (item.dueTime && item.dueTime.startsWith(hour.split(':')[0])) ||
                            (item.time && item.time.startsWith(hour.split(':')[0]))
                  );

                  return (
                    <div key={hour} className={styles.timelineRow}>
                      <div className={styles.timelineHour}>{hour}</div>
                      <div className={styles.timelineContent}>
                        {hourItems.length === 0 ? (
                          <div className={styles.timelineEmptySlot} />
                        ) : (
                          hourItems.map((item, idx) => (
                            <div
                              key={idx}
                              className={`${styles.timelineItem} ${item.done ? styles.timelineItemDone : ''}`}
                            >
                              <span className={styles.timelineMarker}>
                                {item.itemType === 'task' ? (
                                  item.marker.type === 'EMOJI' ? item.marker.value : '🔵'
                                ) : '📅'}
                              </span>
                              <span className={styles.timelineTitle}>{item.title}</span>
                              <span className={styles.timelineCategory}>{item.category || item.type}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Task Modal */}
      {modalOpen && (
        <TaskModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          taskToEdit={null}
        />
      )}
    </>
  );
}

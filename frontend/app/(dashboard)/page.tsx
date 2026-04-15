import { createClient } from '@/lib/supabase/server'
import { formatRelative } from '@/lib/utils'
import { STAGE_MAP, PRIORITY_COLORS } from '@/lib/constants'
import type { Task, ActivityLog } from '@/types'
import Link from 'next/link'
import { BreakingAlert } from '@/components/dashboard/BreakingAlert'
import { DashboardRealtime } from '@/components/dashboard/DashboardRealtime'

async function getDashboardData() {
  const supabase = await createClient()

  const [{ data: tasks }, { data: activity }, { data: upcoming }] = await Promise.all([
    supabase.from('tasks').select('id,task_ref,title,brief,priority,current_stage,deadline,assigned_to,created_at').order('created_at', { ascending: false }).limit(50),
    supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(8),
    supabase.from('tasks').select('id,task_ref,title,deadline,current_stage,priority').not('deadline', 'is', null).lte('deadline', new Date(Date.now() + 14 * 86400000).toISOString()).order('deadline', { ascending: true }).limit(5),
  ])

  return {
    tasks: (tasks || []) as Task[],
    activity: (activity || []) as ActivityLog[],
    upcoming: (upcoming || []) as Task[],
  }
}

function StatCard({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color?: string }) {
  let gradient = 'linear-gradient(135deg, #161616 0%, #0F0F0F 100%)'
  if (label === 'Urgent') gradient = 'linear-gradient(135deg, rgba(204,31,31,0.12), #0F0F0F)'
  else if (label === 'Overdue') gradient = 'linear-gradient(135deg, rgba(245,158,11,0.12), #0F0F0F)'
  else if (label === 'Publishing') gradient = 'linear-gradient(135deg, rgba(139,92,246,0.12), #0F0F0F)'

  return (
    <div className="card-tilt" data-testid={`stat-card-${label.toLowerCase().replace(/\s+/g,'-')}`} style={{ background: gradient, border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 4px 16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: '#9B9B9B', letterSpacing: '0.15em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.5rem', color: color || '#F5F5F5', letterSpacing: '0.05em', lineHeight: 1, textShadow: color === '#FFFFFF' ? '0 0 8px rgba(255,255,255,0.08)' : 'none' }}>{value}</div>
      {sub && <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: '#A8A8A8' }}>{sub}</div>}
    </div>
  )
}

export default async function DashboardPage() {
  const { tasks, activity, upcoming } = await getDashboardData()

  const stageGroups = {
    script: tasks.filter(t => t.current_stage === 'script').length,
    voice: tasks.filter(t => t.current_stage === 'voice').length,
    editing: tasks.filter(t => t.current_stage === 'editing').length,
    publishing: tasks.filter(t => t.current_stage === 'publishing').length,
  }
  const urgent = tasks.filter(t => t.priority === 'urgent').length
  const overdue = tasks.filter(t => t.is_overdue).length

  return (
    <>
      {/* Realtime subscriptions — refreshes server data on DB changes */}
      <DashboardRealtime />
      {/* Breaking alert banner — admin/super_admin only */}
      <BreakingAlert />
      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', letterSpacing: '0.08em', color: '#FFFFFF', textShadow: '0 0 12px rgba(204,31,31,0.08), 0 0 24px rgba(255,255,255,0.03)', margin: 0, lineHeight: 1 }}>Newsroom Operations</h2>
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', color: '#999999', marginTop: '0.35rem' }}>
          Prime time readiness and pipeline status — East Africa Time
        </p>
      </div>

      {/* KPI Cards */}
      <div data-testid="stat-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: '#2A2A2A' }}>
        <StatCard label="Total Tasks" value={tasks.length} sub="in pipeline" />
        <StatCard label="Urgent" value={urgent} color="#CC1F1F" sub="need attention" />
        <StatCard label="Overdue" value={overdue} color="#F59E0B" sub="past deadline" />
        <StatCard label="Publishing" value={stageGroups.publishing} color="#8B5CF6" sub="near air" />
      </div>

      {/* Pipeline + Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: '#2A2A2A' }}>
        {/* Pipeline */}
        <div style={{ background: 'linear-gradient(135deg, #131316 0%, #0D0D10 100%)',
border: '1px solid rgba(255,255,255,0.05)', borderLeft: '3px solid #CC1F1F', padding: '1.25rem 1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)' }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1rem', letterSpacing: '0.1em', color: '#FFFFFF', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            PIPELINE STATUS
            <Link href="/tasks" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: '#CC1F1F', textDecoration: 'none' }}>View Kanban →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {(['script','voice','editing','publishing'] as const).map(stage => {
              const s = STAGE_MAP[stage]
              const count = stageGroups[stage]
              const pct = tasks.length > 0 ? Math.round((count / tasks.length) * 100) : 0
              return (
                <div key={stage}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: s.color }}>{count}</span>
                  </div>
                  <div style={{ height: '4px', background: '#1A1A1A' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: s.color, transition: 'width 400ms ease', boxShadow: `0 0 8px ${s.color}33` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Activity Feed */}
        <div style={{ background: 'linear-gradient(135deg, #131316 0%, #0D0D10 100%)', border: '1px solid rgba(255,255,255,0.05)', borderLeft: '3px solid #3B82F6', padding: '1.25rem 1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)' }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1rem', letterSpacing: '0.1em', color: '#FFFFFF', marginBottom: '1rem' }}>RECENT ACTIVITY</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {activity.length === 0 ? (
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: '#555555' }}>No recent activity</div>
            ) : (
              activity.map((log: ActivityLog) => (
                <div key={log.id} data-testid="activity-item" style={{ display: 'flex', gap: '0.6rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(26,26,26,0.8)' }}>
                  <div style={{ width: '6px', height: '6px', background: '#3B82F6', borderRadius: '9999px', marginTop: '6px', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: '#F0F0F0', textTransform: 'capitalize' }}>
                      {log.action.replace(/_/g, ' ')}
                    </div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6rem', color: '#808080' }}>
                      {formatRelative(log.created_at)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
{/* FEATURED BROADCASTS */}
<div style={{ marginTop: '10px' }}>
  <div style={{
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: '1rem',
    letterSpacing: '0.1em',
    color: '#FFFFFF',
    marginBottom: '1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: '1rem',
    borderLeft: '3px solid #8B5CF6'
  }}>
    <span>FEATURED BROADCASTS</span>
    <span style={{
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: '0.6rem',
      color: '#666666',
      letterSpacing: '0.08em'
    }}>
      DEMO THUMBNAIL PREVIEW
    </span>
  </div>

  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '16px'
  }}>
    {[
      {
        title: "THE IMPACT NA HARMO RAPPER | NATAKA KUWA MBUNGE WA MTWARA",
        img: "/thumbnails/yt-thumb-1.jpg",
        duration: "34:43"
      },
      {
        title: "#EXCLUSIVE: MICHEZO NA JAMII NA ALLY YANGA | MWARABU KAJICHANGANYA",
        img: "/thumbnails/yt-thumb-2.jpg",
        duration: "23:58"
      },
      {
        title: "PISIKALI NA ZHENAY: NATONGOZWA, NILICHWA SIKU YA VALENTINE",
        img: "/thumbnails/yt-thumb-3.jpg",
        duration: "31:18"
      },
      {
        title: "MAFAILI MAPYA YA EPSTEIN YANATISHA | TANZANIA NA KENYA ZATAJWA",
        img: "/thumbnails/yt-thumb-4.jpg",
        duration: "11:23"
      },
      {
        title: "MICHEZO NA JAMII NA MRISHO NGASSA | NILIKUWA SICHEZESHI KISA SIJANYOA",
        img: "/thumbnails/yt-thumb-5.jpg",
        duration: "37:02"
      }
    ].map((item, i) => (
      <div
        key={i}
        style={{
  background: 'linear-gradient(135deg, rgba(139,92,246,0.06), #0D0D10)',
  border: '1px solid rgba(255,255,255,0.05)',
  overflow: 'hidden',
  boxShadow: '0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)'
}}
      >
        <div style={{
          position: 'relative',
          aspectRatio: '16 / 9',
          backgroundImage: `url(${item.img})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderBottom: '2px solid #CC1F1F'
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.18), rgba(0,0,0,0.02))'
          }} />

          <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(0,0,0,0.75)',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '4px 8px'
          }}>
            <span style={{
              width: 0,
              height: 0,
              borderTop: '6px solid transparent',
              borderBottom: '6px solid transparent',
              borderLeft: '10px solid #FFFFFF',
              display: 'inline-block'
            }} />
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.55rem',
              color: '#FFFFFF',
              letterSpacing: '0.08em'
            }}>
              PREVIEW
            </span>
          </div>

          <div style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            background: 'rgba(0,0,0,0.85)',
            color: '#EAEAEA',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.6rem',
            padding: '3px 7px'
          }}>
            {item.duration}
          </div>
        </div>

        <div style={{ padding: '12px 12px 14px' }}>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.68rem',
            color: '#F0F0F0',
            lineHeight: '1.45',
            minHeight: '2.9em'
          }}>
            {item.title}
          </div>
        </div>
      </div>
    ))}
  </div>
</div>
      {/* Upcoming + Recent Tasks */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1px', background: '#2A2A2A' }}>
        {/* Deadlines */}
        <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.06), #0D0D10)', border: '1px solid rgba(255,255,255,0.05)', borderLeft: '3px solid #F59E0B', padding: '1.25rem 1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)' }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1rem', letterSpacing: '0.1em', color: '#FFFFFF', marginBottom: '1rem' }}>UPCOMING DEADLINES</div>
          {upcoming.length === 0 ? (
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: '#555555' }}>No upcoming deadlines</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {upcoming.map(task => (
                <Link key={task.id} href={`/tasks/${task.id}`} data-testid="deadline-item" className="hover-border-primary" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'rgba(26,26,26,0.4)', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.04)', transition: 'border-color 150ms, background-color 120ms' }}>
                  <div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: '#F0F0F0' }}>{task.title}</div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6rem', color: '#B8B8B8' }}>{task.task_ref} · {STAGE_MAP[task.current_stage]?.label}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.55rem', color: PRIORITY_COLORS[task.priority], border: `1px solid ${PRIORITY_COLORS[task.priority]}`, padding: '0.1rem 0.35rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{task.priority}</span>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6rem', color: '#F59E0B', marginTop: '0.2rem' }}>
                      {task.deadline ? new Date(task.deadline).toLocaleDateString('en-KE', { timeZone: 'Africa/Nairobi', day: '2-digit', month: 'short' }) : '—'}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Tasks */}
        <div style={{ background: 'linear-gradient(135deg, #131316 0%, #0D0D10 100%)', border: '1px solid rgba(255,255,255,0.05)', borderLeft: '3px solid #22C55E', padding: '1.25rem 1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)' }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1rem', letterSpacing: '0.1em', color: '#FFFFFF', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            RECENT TASKS
            <Link href="/tasks/new" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: '#FF4D4D', textDecoration: 'none', background: 'rgba(204,31,31,0.12)', border: '1px solid rgba(204,31,31,0.35)', padding: '0.3rem 0.75rem', letterSpacing: '0.1em' }}>+ NEW TASK</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 100px 80px', gap: '0.5rem', padding: '0.4rem 0.5rem', borderBottom: '1px solid rgba(42,42,42,0.6)', fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6rem', color: '#808080', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            <span>REF</span><span>TITLE</span><span>STAGE</span><span>PRIORITY</span>
          </div>
          {tasks.slice(0, 8).map(task => {
            const stage = STAGE_MAP[task.current_stage]
            return (
              <Link key={task.id} href={`/tasks/${task.id}`} data-testid="task-row" className="hover-row" style={{ display: 'grid', gridTemplateColumns: '80px 1fr 100px 80px', gap: '0.5rem', padding: '0.6rem 0.5rem', borderBottom: '1px solid rgba(26,26,26,0.6)', textDecoration: 'none', transition: 'background 120ms', alignItems: 'center', background: 'transparent' }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: '#FF6B6B' }}>{task.task_ref}</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: '#F0F0F0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: stage?.color || '#A0A0A0' }}>{stage?.label}</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6rem', color: PRIORITY_COLORS[task.priority] || '#A0A0A0', textTransform: 'uppercase' }}>{task.priority}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
    </>
  )
}

import React from 'react';
import {
  BadgeCheck,
  BookOpen,
  Check,
  ListChecks,
  LucideIcon,
  Repeat,
  TrendingUp,
  UserRound,
} from 'lucide-react';

interface ChipProps {
  icon: LucideIcon;
  label: string;
}

const Chip: React.FC<ChipProps> = ({ icon: Icon, label }) => (
  <span className="sviz-chip">
    <Icon />
    {label}
  </span>
);

/** Framed Mushaf page — represents adding Qur'an memorisation to a space. */
export const MushafVisual: React.FC = () => (
  <>
    <div className="sviz">
      <div className="sviz-page">
        <span className="sviz-page__frame" />
        <span className="sviz-page__band" />
        <div className="sviz-page__cols">
          <div className="sviz-page__col">
            <i style={{ width: '92%' }} />
            <i style={{ width: '70%' }} />
            <i style={{ width: '86%' }} />
            <i style={{ width: '62%' }} />
            <i style={{ width: '78%' }} />
          </div>
          <div className="sviz-page__col">
            <i style={{ width: '82%' }} />
            <i style={{ width: '94%' }} />
            <i style={{ width: '66%' }} />
            <i style={{ width: '88%' }} />
            <i style={{ width: '72%' }} />
          </div>
        </div>
        <span className="sviz-page__ribbon" />
      </div>
    </div>
    <Chip icon={BookOpen} label="604 halaman" />
  </>
);

/** Prioritised review queue — represents a focused daily review list. */
export const QueueVisual: React.FC = () => (
  <>
    <div className="sviz">
      <div className="sviz-queue">
        <div className="sviz-queue__row is-active">
          <span className="sviz-queue__check"><Check /></span>
          <span className="sviz-queue__lines">
            <i style={{ width: '74%' }} />
            <i style={{ width: '46%' }} />
          </span>
        </div>
        <div className="sviz-queue__row">
          <span className="sviz-queue__check" />
          <span className="sviz-queue__lines">
            <i style={{ width: '62%' }} />
            <i style={{ width: '38%' }} />
          </span>
        </div>
        <div className="sviz-queue__row">
          <span className="sviz-queue__check" />
          <span className="sviz-queue__lines">
            <i style={{ width: '68%' }} />
            <i style={{ width: '42%' }} />
          </span>
        </div>
      </div>
    </div>
    <Chip icon={ListChecks} label="12 materi" />
  </>
);

const CURVE_PATH =
  'M 14 112 C 32 106, 40 100, 56 94 C 78 86, 88 82, 106 74 C 128 64, 140 56, 160 46 C 184 34, 200 24, 222 14';
const CURVE_POINTS: Array<[number, number]> = [
  [14, 112],
  [56, 94],
  [106, 74],
  [160, 46],
  [222, 14],
];

/** Rising spacing curve — represents intervals that grow as memory strengthens. */
export const ScheduleVisual: React.FC = () => (
  <>
    <div className="sviz">
      <svg className="sviz-curve" viewBox="0 0 260 132" focusable="false">
        <line className="sviz-curve__axis" x1="14" y1="122" x2="222" y2="122" />
        <path className="sviz-curve__area" d={`${CURVE_PATH} L 222 122 L 14 122 Z`} />
        <path className="sviz-curve__line" d={CURVE_PATH} />
        {CURVE_POINTS.map(([cx, cy], index) => (
          <circle
            key={cx}
            className={`sviz-curve__dot${index === CURVE_POINTS.length - 1 ? ' is-last' : ''}`}
            cx={cx}
            cy={cy}
            r={index === CURVE_POINTS.length - 1 ? 7 : 6}
          />
        ))}
      </svg>
    </div>
    <Chip icon={Repeat} label="Interval menyesuaikan" />
  </>
);

/** Verified progress report — represents a teacher monitoring a student. */
export const GrowthVisual: React.FC = () => (
  <>
    <div className="sviz">
      <div className="sviz-report">
        <div className="sviz-report__head">
          <span className="sviz-report__avatar"><UserRound /></span>
          <span className="sviz-report__name">
            <i style={{ width: '58px' }} />
            <i style={{ width: '38px' }} />
          </span>
          <span className="sviz-report__verified"><BadgeCheck /></span>
        </div>
        <div className="sviz-report__progress">
          <span className="sviz-report__label">Progres</span>
          <span className="sviz-report__pct">86%</span>
          <span className="sviz-report__track"><i style={{ width: '86%' }} /></span>
        </div>
      </div>
    </div>
    <Chip icon={TrendingUp} label="Progres santri" />
  </>
);

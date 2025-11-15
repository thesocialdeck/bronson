/**
 * Skeleton Loading Components
 *
 * Beautiful loading states that match the actual content structure.
 * Provides better UX than spinners or blank states.
 */

export const SkeletonCard = () => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-4 animate-pulse">
      <div className="flex items-start gap-3">
        {/* Avatar skeleton */}
        <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />

        <div className="flex-1 space-y-3">
          {/* Title skeleton */}
          <div className="h-4 bg-gray-200 rounded w-1/3" />

          {/* Content lines */}
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="h-3 bg-gray-200 rounded w-2/3" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const SkeletonEventItem = () => {
  return (
    <div className="flex items-start gap-2 animate-pulse">
      <div className="w-8 h-8 bg-gray-200 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  );
};

export const SkeletonPersonDayCard = () => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-4 animate-pulse">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 bg-gray-200 rounded-full" />
        <div className="h-5 bg-gray-200 rounded w-24" />
      </div>
      <div className="space-y-3">
        <SkeletonEventItem />
        <SkeletonEventItem />
      </div>
    </div>
  );
};

export const SkeletonChecklistCard = () => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-4 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-200 rounded-lg" />
          <div className="h-5 bg-gray-200 rounded w-32" />
        </div>
        <div className="w-12 h-6 bg-gray-200 rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-5/6" />
        <div className="h-3 bg-gray-200 rounded w-4/6" />
      </div>
    </div>
  );
};

export const SkeletonContactCard = () => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-4 animate-pulse">
      <div className="space-y-2">
        <div className="h-5 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />
      </div>
    </div>
  );
};

export const SkeletonDayCard = () => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-4 flex-shrink-0 w-24 animate-pulse">
      <div className="text-center space-y-2">
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="w-10 h-10 bg-gray-200 rounded-full mx-auto" />
        <div className="space-y-1 mt-3">
          <div className="h-2 bg-gray-200 rounded w-full" />
          <div className="h-2 bg-gray-200 rounded w-3/4 mx-auto" />
        </div>
      </div>
    </div>
  );
};

interface SkeletonGridProps {
  count?: number;
  children: React.ReactNode;
}

export const SkeletonGrid = ({ count = 3, children }: SkeletonGridProps) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>{children}</div>
      ))}
    </div>
  );
};

import { useCallback, useEffect, useState } from 'react';

import type { StatisticsDashboardData } from '../types/statistics';
import { getStatisticsDashboardData } from '../services/statistics-service';

type StatisticsDashboardState =
  | {
      data: StatisticsDashboardData;
      errorMessage?: undefined;
      status: 'ready';
    }
  | {
      data?: undefined;
      errorMessage?: string;
      status: 'error' | 'loading';
    };

export const useStatisticsDashboard = (goalAmount: number) => {
  const [state, setState] = useState<StatisticsDashboardState>({ status: 'loading' });
  const [refreshSequence, setRefreshSequence] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      const data = await getStatisticsDashboardData({ goalAmount });

      if (isMounted) {
        setState({
          data,
          status: 'ready',
        });
      }
    };

    load().catch(() => {
      if (isMounted) {
        setState({
          errorMessage: "We couldn't load statistics.",
          status: 'error',
        });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [goalAmount, refreshSequence]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setRefreshSequence((currentValue) => currentValue + 1);
  }, []);

  return {
    ...state,
    retry,
  };
};

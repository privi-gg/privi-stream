import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const now = () => dayjs().unix();

export const formatDate = (date: Date | number, format: string = 'DD MMM, hh:mm A') =>
  dayjs(date).format(format);

export const formatTimeDifference = (date1: Date | number, date2: Date | number) => {
  const d1 = dayjs(date1);
  const d2 = dayjs(date2);
  const diffMinutes = d1.diff(d2, 'minute');
  let unit = 'seconds';
  if (diffMinutes < 60) {
    unit = 'minute';
  } else if (diffMinutes < 24 * 60) {
    unit = 'hour';
  } else if (diffMinutes < 7 * 24 * 60) {
    unit = 'day';
  } else if (diffMinutes < 30 * 24 * 60) {
    unit = 'week';
  } else if (diffMinutes < 365 * 24 * 60) {
    unit = 'month';
  } else {
    unit = 'year';
  }

  return `${d1.diff(d2, unit as any)} ${unit}s`;
};

export const formatTimeDuration = (seconds: number) => {
  const d1 = dayjs();
  const d2 = d1.subtract(seconds, 'second');
  const diffMinutes = d1.diff(d2, 'minute');
  let unit = 'seconds';
  if (diffMinutes < 60) {
    unit = 'minute';
  } else if (diffMinutes < 24 * 60) {
    unit = 'hour';
  } else if (diffMinutes < 7 * 24 * 60) {
    unit = 'day';
  } else if (diffMinutes < 30 * 24 * 60) {
    unit = 'week';
  } else if (diffMinutes < 365 * 24 * 60) {
    unit = 'month';
  } else {
    unit = 'year';
  }

  return `${d1.diff(d2, unit as any)} ${unit}s`;
};

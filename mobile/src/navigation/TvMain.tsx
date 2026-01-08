import React, { useState } from 'react';
import JobsScreen from '../screens/JobsScreen';

export default function TvMain() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  return <JobsScreen selectedDate={selectedDate} setSelectedDate={setSelectedDate} variant="tv" />;
}

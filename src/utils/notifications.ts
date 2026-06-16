import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleTaskNotification(
  taskId: string,
  title: string,
  dueDate: string,
): Promise<void> {
  const granted = await requestNotificationPermission();
  if (!granted) return;

  const due = new Date(dueDate);
  const now = new Date();

  await Notifications.cancelScheduledNotificationAsync(`task_due_${taskId}`);
  await Notifications.cancelScheduledNotificationAsync(`task_due_day_${taskId}`);

  const dayBefore = new Date(due);
  dayBefore.setDate(dayBefore.getDate() - 1);
  dayBefore.setHours(9, 0, 0, 0);

  if (dayBefore > now) {
    await Notifications.scheduleNotificationAsync({
      identifier: `task_due_${taskId}`,
      content: {
        title: 'Tarefa vence amanhã',
        body: title,
        data: { taskId },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: dayBefore },
    });
  }

  const dueDay = new Date(due);
  dueDay.setHours(9, 0, 0, 0);

  if (dueDay > now) {
    await Notifications.scheduleNotificationAsync({
      identifier: `task_due_day_${taskId}`,
      content: {
        title: 'Tarefa vence hoje',
        body: title,
        data: { taskId },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: dueDay },
    });
  }
}

export async function cancelTaskNotification(taskId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(`task_due_${taskId}`);
  await Notifications.cancelScheduledNotificationAsync(`task_due_day_${taskId}`);
}

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { TasksScreen } from '../screens/TasksScreen';
import { TaskDetailScreen } from '../screens/TaskDetailScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { AdminScreen } from '../screens/AdminScreen';
import type { Task } from '../types';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  TaskDetail: { taskId: string };
  Admin: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Tasks: undefined;
  Admin: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = { Home: '🎙️', Tasks: '📋', Admin: '⚙️' };
  return (
    <View className="items-center">
      <Text className="text-lg">{icons[label] ?? '•'}</Text>
      <Text className={`text-xs mt-1 ${focused ? 'text-primary-light' : 'text-slate-500'}`}>
        {label === 'Home' ? 'Captura' : label === 'Tasks' ? 'Tarefas' : 'Admin'}
      </Text>
    </View>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function MainTabs({ isAdmin }: { isAdmin: boolean }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1E293B',
          borderTopColor: '#334155',
          height: 70,
          paddingBottom: 10,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Home" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Tasks"
        component={TasksScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Tasks" focused={focused} />,
        }}
      />
      {isAdmin ? (
        <Tab.Screen
          name="Admin"
          component={AdminScreen}
          options={{
            tabBarIcon: ({ focused }) => <TabIcon label="Admin" focused={focused} />,
          }}
        />
      ) : null}
    </Tab.Navigator>
  );
}

export function RootNavigator({
  isAuthenticated,
  isAdmin,
}: {
  isAuthenticated: boolean;
  isAdmin: boolean;
}) {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0F172A' } }}>
      {!isAuthenticated ? (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <>
          <RootStack.Screen name="Main">
            {() => <MainTabs isAdmin={isAdmin} />}
          </RootStack.Screen>
          <RootStack.Screen
            name="TaskDetail"
            component={TaskDetailScreen}
            options={{ presentation: 'modal', headerShown: true, headerStyle: { backgroundColor: '#1E293B' }, headerTintColor: '#fff', title: 'Detalhes' }}
          />
        </>
      )}
    </RootStack.Navigator>
  );
}

export type { Task };

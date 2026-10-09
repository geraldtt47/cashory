import {
  View,
  Text,
  Alert,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import React from "react";
import { format } from "date-fns";
import useAuthTheme from "@/hooks/use-auth-theme";
import { useThemeColors } from "@/lib/use-theme-colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/use-notifications";
import { Container } from "@/components/container";
import CashoryScreenHeader from "@/components/base/cashory-screen-header";
import { GeneralSearch } from "@/components/ui/icons/GeneralSearch";
import { GeneralOption } from "@/components/ui/icons/GeneralOption";
import { GeneralAlarm } from "@/components/ui/icons/GeneralAlarm";
import { GeneralCheckCirc } from "@/components/ui/icons/GeneralCheckCirc";
import { GeneralMaintenan } from "@/components/ui/icons/GeneralMaintenan";
import CashoryNotificationCard from "@/components/base/cashory-notification-card";

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "success":
      return <GeneralCheckCirc color="#FFFFFF" width={24} height={24} />;
    case "alert":
      return <GeneralAlarm color="#FFFFFF" width={24} height={24} />;
    case "info":
    default:
      return <GeneralMaintenan color="#FFFFFF" width={24} height={24} />;
  }
};

export default function Notifications() {
  const { isDark } = useAuthTheme();
  const { iconColor } = useThemeColors();
  const insets = useSafeAreaInsets();

  const { data: notificationsResponse, isLoading } = useNotifications();
  const markAllRead = useMarkAllNotificationsRead();
  const markRead = useMarkNotificationRead();

  const handleMarkAllRead = async () => {
    try {
      await markAllRead.mutateAsync();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to mark all as read");
    }
  };

  const handleMarkRead = async (id: string, isRead: boolean) => {
    if (!isRead) {
      try {
        await markRead.mutateAsync({ id, isRead: true });
      } catch (error) {
        console.error(error);
      }
    }
  };

  const notifications = notificationsResponse?.data ?? [];

  return (
    <Container className="px-4" isScrollable={false}>
      <ScrollView
        className="flex-1 w-full"
        contentContainerStyle={{
          paddingTop: insets.top + 10,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Navigation */}
        <CashoryScreenHeader
          title="Notification"
          rightElement={
            <>
              <Pressable className="w-12.5 h-12.5 rounded-[40px] bg-brand-flashwhite dark:bg-dark-charcoal-green items-center justify-center">
                <GeneralSearch color={iconColor} width={24} height={24} />
              </Pressable>
              <Pressable
                onPress={handleMarkAllRead}
                disabled={markAllRead.isPending}
                className="w-12.5 h-12.5 rounded-[40px] bg-brand-flashwhite dark:bg-dark-charcoal-green items-center justify-center ml-1.5"
              >
                <GeneralOption color={iconColor} width={24} height={24} />
              </Pressable>
            </>
          }
        />
        {/* List of Notifications */}
        <View className="flex-col w-full">
          {isLoading ? (
            <View className="py-10 items-center justify-center">
              <ActivityIndicator size="large" />
            </View>
          ) : notifications.length === 0 ? (
            <View className="py-10 items-center justify-center">
              <Text className="text-brand-grey text-[14px]">
                No notifications yet.
              </Text>
            </View>
          ) : (
            notifications.map((item: any) => {
              return (
                <Pressable
                  key={item.id}
                  onPress={() => handleMarkRead(item.id, item.isRead)}
                >
                  <CashoryNotificationCard
                    title={item.title}
                    description={item.description}
                    time={format(new Date(item.createdAt), "hh:mm a")}
                    icon={getNotificationIcon(item.type)}
                    isUnread={!item.isRead}
                  />
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>
    </Container>
  );
}

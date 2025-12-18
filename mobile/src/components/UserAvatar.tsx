// Reusable user avatar component
import React from 'react';
import { Avatar } from 'react-native-paper';

interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  color: string;
  size?: number;
}

export default function UserAvatar({ name, avatarUrl, color, size = 48 }: UserAvatarProps) {
  if (avatarUrl) {
    return <Avatar.Image size={size} source={{ uri: avatarUrl }} />;
  }

  return (
    <Avatar.Text
      size={size}
      label={name[0]?.toUpperCase() || '?'}
      style={{ backgroundColor: color }}
    />
  );
}

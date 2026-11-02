import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const hospitalImageFallbacks = {
  'Bệnh Viện Tim mạch An Giang': 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=600',
  'Bệnh viện Quân Y 175': 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600',
  'Bệnh viện Nhi đồng 2': 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600',
  'Bệnh viện Đa khoa An Phúc': 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=600',
};

const getImageUrl = (value) =>
  typeof value === 'string' && /^https?:\/\/\S+$/i.test(value.trim()) ? value.trim() : null;

export function DoctorAvatar({ uri, style, iconSize = 28 }) {
  const imageUrl = getImageUrl(uri);
  const [hasError, setHasError] = useState(false);

  if (!imageUrl || hasError) {
    return (
      <View style={[styles.placeholder, style]}>
        <MaterialCommunityIcons name="account" size={iconSize} color="#94A3B8" />
      </View>
    );
  }

  return <Image source={{ uri: imageUrl }} style={style} onError={() => setHasError(true)} />;
}

export function HospitalImage({ hospital, style, iconSize = 28 }) {
  const databaseUrl = getImageUrl(hospital?.image_url);
  const fallbackUrl = hospitalImageFallbacks[hospital?.name?.trim()];
  const [databaseImageFailed, setDatabaseImageFailed] = useState(false);
  const [fallbackImageFailed, setFallbackImageFailed] = useState(false);

  const imageUrl = databaseImageFailed ? (!fallbackImageFailed ? fallbackUrl : null) : databaseUrl || fallbackUrl;

  if (!imageUrl) {
    return (
      <View style={[styles.placeholder, style]}>
        <MaterialCommunityIcons name="hospital-building" size={iconSize} color="#94A3B8" />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: imageUrl }}
      style={style}
      onError={() => {
        if (databaseUrl && !databaseImageFailed) {
          setDatabaseImageFailed(true);
        } else {
          setFallbackImageFailed(true);
        }
      }}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
});

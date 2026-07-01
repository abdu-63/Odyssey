import React from 'react';
import { StyleSheet, View } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { useExploration } from '@/hooks/useExploration';
import { FogOverlayLayer } from './FogOverlayLayer';

export function FogMap() {
  const { fogPolygon } = useExploration();

  return (
    <View style={styles.container}>
      <Mapbox.MapView 
        style={styles.map}
        styleURL={Mapbox.StyleURL.Dark}
        logoEnabled={false}
        compassEnabled={false}
      >
        <Mapbox.Camera
          followUserLocation
          followZoomLevel={15}
          animationMode="flyTo"
          animationDuration={1000}
        />
        
        <Mapbox.UserLocation showsUserHeadingIndicator />
        
        <FogOverlayLayer fogPolygon={fogPolygon} />
      </Mapbox.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
});

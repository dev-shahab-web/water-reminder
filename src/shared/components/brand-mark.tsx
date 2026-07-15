import { Image, StyleSheet, View } from 'react-native';

const brandMarkSource = require('../../../assets/branding/app/widget-icon.png');

type BrandMarkProps = {
  label?: string;
  size?: number;
};

export function BrandMark({ label = 'Water Reminder', size = 112 }: BrandMarkProps) {
  return (
    <View
      accessibilityLabel={label}
      accessibilityRole="image"
      style={[
        styles.container,
        {
          borderRadius: size / 2,
          height: size,
          width: size,
        },
      ]}
    >
      <Image
        accessibilityElementsHidden
        importantForAccessibility="no"
        resizeMode="contain"
        source={brandMarkSource}
        style={styles.image}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    height: '100%',
    width: '100%',
  },
});

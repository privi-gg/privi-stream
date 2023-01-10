import { withDefaultColorScheme, extendTheme, ThemeConfig } from '@chakra-ui/react';

import colors from './colors';
import fonts from './fonts';
import components from './components';

const theme: ThemeConfig = extendTheme(
  {
    // config: { initialColorMode: 'light', useSystemColorMode: false },
    colors,
    fonts,
    components,
  },
  withDefaultColorScheme({ colorScheme: 'primary' }),
);

export default theme;

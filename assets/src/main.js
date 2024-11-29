import App from './components/App.js';

import ZDClient from './services/ZDClient.js';
import i18n from './i18n/index.js';

let app = {};
const initVueApp = async data => {
  app = Vue.createApp(App);
  app.use(i18n);
  app.config.globalProperties.$currentUser = await ZDClient.get('currentUser');

  // External components
  app.use(VsSelect.plugin);

  app.mount('#app');
};

ZDClient.init();
ZDClient.events['ON_APP_REGISTERED'](initVueApp);

export { app };

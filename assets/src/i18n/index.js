import dictionary from './dictionary.js';
import { app } from '../main.js';

export default {
  install(Vue, options) {
    const RTL_LOCALES = ['ar', 'he'];
    app.config.globalProperties.$t = (key, replaceObject) => {
      const t = app.config.globalProperties.$currentUser.locale
        ? dictionary[app.config.globalProperties.$currentUser.locale] ||
          dictionary[app.config.globalProperties.$currentUser.locale.split('-')[0]] ||
          dictionary['en']
        : dictionary['en'];
      let result = key.split('.').reduce((p, c) => (p && p[c]) || null, t) || '';
      if (replaceObject) {
        result = this.curlyFormat(result, replaceObject);
      }
      return result;
    };
    app.provide('$t', app.config.globalProperties.$t);
    app.config.globalProperties.$rtl = () => {
      return RTL_LOCALES.indexOf(options.locale.toLowerCase()) > -1 ? 'rtl' : 'ltr';
    };
  },
  curlyFormat(str, context) {
    const regex = /{{\s?(.*?)\s?}}/g;
    const matches = [];
    let match;

    do {
      match = regex.exec(str);
      if (match) {
        matches.push(match);
      }
    } while (match);

    return matches.reduce((str, match) => {
      const newRegex = new RegExp(match[0], 'g');
      str = str.replace(newRegex, context[match[1]]);
      return str;
    }, str);
  },
};

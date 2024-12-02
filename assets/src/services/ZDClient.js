let CLIENT = {};
let APP_METADATA = null;
let APP_SETTINGS = {};
let CONTEXT = null;
let SIDEBAR_CLIENT = null;
let ZD_SUBDOMAIN = null;

const ZDClient = {
  events: {
    ON_APP_REGISTERED(cb) {
      return CLIENT.on('app.registered', async data => {
        APP_METADATA = data.metadata;
        APP_SETTINGS = data.metadata.settings;
        CONTEXT = data.context;
        ZD_SUBDOMAIN = CONTEXT.account.subdomain;
        return cb(data);
      });
    },

    MODAL_READY() {
      CLIENT.trigger('modalReady');
    },

    GET_DATA_IN_MODAL(callback) {
      return CLIENT.on('getData', data => {
        return callback(data);
      });
    },

    SET_SIDEBAR_CLIENT(data = {}) {
      SIDEBAR_CLIENT = CLIENT.instance(data.instanceGuid || '');
    },
  },

  init() {
    CLIENT = ZAFClient.init();
  },

  /**
   * Set getters for private objects
   */
  app: {
    /**
     * It returns true if the app is installed in the instance, false if
     * it's running locally
     */
    get isProduction() {
      return !!this.settings.IS_PRODUCTION;
    },
    get settings() {
      return APP_SETTINGS;
    },
    get metadata() {
      return APP_METADATA;
    },
    get subdomain() {
      return ZD_SUBDOMAIN;
    },
  },

  /**
   * Get sidebar client based on modal/sidebar
   * @returns {Object}
   */
  getSidebarClient() {
    return SIDEBAR_CLIENT || CLIENT;
  },

  /**
   * It sets the frame height using on the passed value.
   * If no value has been passed, 80 will be set as default heigth.
   * @param {Int} newHeight
   */
  resizeFrame(appHeight) {
    CLIENT.invoke('resize', { width: '100%', height: `${appHeight}px` });
  },

  /**
   * Calls ZAFClient.request()
   * @returns {Promise}
   */
  async request(url, data, options = {}) {
    return await CLIENT.request({
      url,
      data,
      secure: APP_SETTINGS.IS_PRODUCTION,
      contentType: 'application/json',
      ...options,
    });
  },

  /**
   * Calls ZAFClient.request()
   * @returns {Promise}
   */
  async newRequest(payload) {
    return await CLIENT.request(payload);
  },

  /**
   * Calls ZAFClient.get()
   * @param {String} getter
   */
  async get(getter) {
    return (await this.getSidebarClient().get(getter))[getter];
  },

  /**
   * Performs ZAFClient.set()
   * @param {Object} param
   */
  async set(param) {
    return await this.getSidebarClient().set(param);
  },

  /**
   * Performs ZAFClient.invoke()
   * @param {String} param
   * @param {Object} data
   */
  async invoke(param, data) {
    return await this.getSidebarClient().invoke(param, data);
  },

  /**
   * Notify user that something happened
   * Usually after taking some action
   * 'notice' = green
   * 'alert' = yellow
   * 'error' = red
   * @param {string} message
   * @param {string} type
   * @param {number} durationInMs
   */
  notify(message, type = 'success', durationInMs = 5000) {
    this.getSidebarClient().invoke('notify', message, type, durationInMs);
  },

  /**
   * Open the modal
   * @param {Object} modalData
   * @param {String} urlParams
   * @param {String} width
   * @param {String} height
   * @returns {Object}
   */
  async openModal(modalData, urlParams = '', width = '80vw', height = '80vh') {
    const modalContext = await CLIENT.invoke('instances.create', {
      location: 'modal',
      url: `assets/iframe.html${urlParams}`,
      size: {
        width,
        height,
      },
    });
    const modalClient = CLIENT.instance(modalContext['instances.create'][0].instanceGuid);
    modalClient.on('modalReady', () => {
      modalClient.trigger('getData', {
        ...modalData,
        sidebarContext: CONTEXT,
      });
    });
    return modalClient;
  },

  closeModal() {
    CLIENT.invoke('destroy');
  },

  /**
   * Get Brands.
   * @returns {Object}
   */
  getBrands() {
    return ZDClient.request(
      `/api/v2/brands`,
      {},
      {
        method: 'GET',
      },
    );
  },

  /**
   * Upload image and get token.
   * @param {Object} payload
   * @returns {Object}
   */
  uploadImage(payload) {
    return ZDClient.request(`/api/v2/guide/user_images/uploads`, JSON.stringify(payload), {
      method: 'POST',
      contentType: 'image/jpeg',
      'X-Amz-Server-Side-Encryption': 'AES256',
    });
  },

  /**
   * Upload image and get token.
   * @param {String} url
   * @param {Object} headers
   * @param {Object} payload
   * @returns {Object}
   */
  uploadImageWithPut(url, headers, payload) {
    return ZDClient.request(url, JSON.stringify(payload), {
      method: 'PUT',
      ...headers,
    });
  },

  /**
   * Create image path by passing token from 'uploadImage' method response.
   * @param {Object} payload
   * @returns {Object}
   */
  createImagePath(payload) {
    return ZDClient.request(`/api/v2/guide/user_images`, JSON.stringify(payload), {
      method: 'POST',
      contentType: 'application/json',
    });
  },
};

export default ZDClient;

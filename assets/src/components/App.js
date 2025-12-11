const template = `
<div class="p-6">

  <div class="upload-container grid grid-cols-2 gap-8">
    <div class="bg-white shadow-md rounded-2xl p-6 h-max">
      <h2 class="text-xl font-semibold text-gray-700 mb-4">Upload User Image</h2>

      <div class="mb-4 w-3/5">
        <vs-select 
          :options="brandOptions" 
          label="Select Brand" 
          v-model="selectedBrandId"
          is-compact
          required>
        </vs-select>
      </div>

      <input type="file" @change="onFileChange" accept="image/*" class="block w-full text-sm text-slate-500
        file:mr-4 file:py-2 file:px-4
        file:rounded-full file:border-0
        file:text-sm file:font-semibold
        file:bg-violet-50 file:text-violet-700 file:cursor-pointer
        hover:file:bg-violet-100 cursor-pointer" />
      <button 
        @click="uploadImage" 
        :disabled="!selectedFile || isCompleted || isLoading" 
        :class="[
          'bg-blue-500 hover:bg-blue-600 px-3 py-2 mt-5 rounded-md text-white cursor-pointer inline-flex items-center gap-2', 
          !selectedFile || isCompleted ? 'bg-gray-300 hover:bg-gray-300 cursor-not-allowed' : ''
        ]">
        <garden-icon 
          name="expand icon"
          color="#ffffff"
          icon="zd-upload">
        </garden-icon>
        <span>Upload</span>
      </button>
    </div>

    <div class="bg-white shadow-md rounded-2xl p-4 content-center">
      <!--Loading-->
      <template v-if="isLoading">
        <div class="gradient-bg">
          <div class="gradients-container">
            <div class="g1"></div>
            <div class="g2"></div>
            <div class="g3"></div>
            <div class="g4"></div>
            <div class="g5"></div>
            <div class="interactive"></div>
          </div>
        </div>
      </template>

      <!--Image Path-->
      <template v-else-if="imagePath">
        <div class="text-center">
          <h2 class="font-semibold">Uploaded Image Succesfully</h2>
          <img :src="imagePath" alt="Uploaded Image" class="w-2/5 rounded-lg mt-2 mb-4 mx-auto" />
          <div class="text-neutral-600 break-all">
            <span class="font-semibold">Image Path: </span><br>
            <span class="break-all">{{ imagePath }}</span>
          </div>
          <button 
            @click="copyImagePath" 
            :disabled="!selectedFile" 
            class="bg-blue-500 hover:bg-blue-600 px-3 py-2 mt-3 rounded-md text-white cursor-pointer inline-flex items-center gap-2">
            <garden-icon 
              name="expand icon"
              color="#ffffff"
              icon="zd-copy">
            </garden-icon>
            <span>Copy Path</span>
          </button>
        </div>
      </template>

      <!--Initial-->
      <template v-else>
        <div class="text-center text-neutral-600 font-light">
          <span>Select brand and upload the image to get public image path.</span><br>
          <span>Can be used in Guide for image path.</span>
        </div>
      </template>
    </div>
  </div>

  <!--Buy Coffee-->
  <div class="text-center fixed bottom-10 left-1/2 translate-x-[-50%]">
    <a href="https://www.buymeacoffee.com/ashwinshenoy?utm_source=zd_user_image" target="_blank">
      <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="width: 140px">
    </a>
  </div>
</div>
`;

import ZDClient from '../services/ZDClient.js';
import GardenIcon from './Common/GardenIcon.js';

const { reactive, onMounted, toRefs } = Vue;
const App = {
  template,

  components: {
    GardenIcon,
  },

  setup() {
    // ----- Data -----
    const data = reactive({
      isLoading: false,
      isCompleted: false,
      selectedFile: null,
      selectedFileArrayBuffer: null,
      selectedBrandId: '',
      uploadUrl: '',
      token: '',
      imagePath: '',
      brandOptions: [],
      allBrands: [],
    });

    onMounted(async () => {
      loadBrands();
    });

    // ----- Methods -----

    /**
     * Loads all available brands from the Zendesk API
     *
     * Fetches the list of brands and transforms them into two formats:
     * - brandOptions: formatted for the UI select dropdown (label/value pairs)
     * - allBrands: raw brand data for reference during image upload
     */
    async function loadBrands() {
      try {
        const response = await ZDClient.getBrands();
        data.brandOptions = response.brands.map(brand => ({
          label: brand.name,
          value: brand.id,
        }));
        data.allBrands = response.brands;
      } catch (error) {
        console.error('Error loading brands:', error);
      }
    }

    /**
     * Handles file input change event when user selects an image
     *
     * Stores the selected file and resets the completion status to allow
     * re-uploading the new file.
     *
     * @param {Event} event - The file input change event
     */
    function onFileChange(event) {
      data.isCompleted = false;
      data.selectedFile = event.target.files[0];
    }

    /**
     * Uploads an image to the selected brand's repository
     *
     * This function performs a 3-step process:
     * 1. Requests upload credentials (URL, token, headers) from the Zendesk API
     * 2. Uploads the image file to the provided URL using a PUT request
     * 3. Creates a public image path by associating the uploaded image with the selected brand
     *
     * @async
     * @returns {Promise<void>}
     * @throws {Error} Logs errors to console if upload fails
     */
    async function uploadImage() {
      // Validate prerequisites
      if (!data.selectedBrandId || !data.selectedFile) {
        return;
      }

      data.isLoading = true;

      try {
        // Step 1: Request upload credentials from Zendesk API
        const { upload } = await ZDClient.uploadImage({
          content_type: data.selectedFile.type,
          file_size: data.selectedFile.size,
        });

        // Step 2: Upload the image file to the provided URL
        await fetch(upload.url, {
          method: 'PUT',
          headers: upload.headers,
          body: data.selectedFile,
          redirect: 'follow',
        });

        // Brief delay to ensure server processing
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Step 3: Create public image path
        const { user_image } = await ZDClient.createImagePath({
          token: upload.token,
          brand_id: data.selectedBrandId.toString(),
        });

        // Construct full image URL
        const selectedBrand = data.allBrands.find(brand => brand.id === data.selectedBrandId);
        data.imagePath = `${selectedBrand.brand_url}${user_image.path}`;
        data.isCompleted = true;
      } catch (error) {
        console.error('Error uploading image:', error);
        data.isCompleted = true;
      } finally {
        data.isLoading = false;
      }
    }

    /**
     * Copies the uploaded image path to the user's clipboard
     *
     * Uses the Clipboard API to copy the image path and notifies the user.
     * Falls back to an alert if the clipboard copy fails.
     *
     * @async
     * @returns {Promise<void>}
     * @throws {Error} Logs errors to console and shows alert if clipboard write fails
     */
    async function copyImagePath() {
      try {
        await navigator.clipboard.writeText(data.imagePath);
        ZDClient.notify('Image path copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy: ', err);
        alert('Failed to copy image path.');
      }
    }

    // returning here functions and variables used by your template
    return { ...toRefs(data), onFileChange, uploadImage, copyImagePath };
  },
};

export default App;

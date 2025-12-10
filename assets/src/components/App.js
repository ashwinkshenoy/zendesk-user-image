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

    function onFileChange(event) {
      data.isCompleted = false;
      data.selectedFile = event.target.files[0];
    }

    async function uploadImage() {
      if (!data.selectedBrandId) return;
      if (!data.selectedFile) return;
      data.isLoading = true;

      try {
        // Step 1: Create Image Upload URL and Token
        const imagePayload = {
          content_type: data.selectedFile.type,
          file_size: data.selectedFile.size,
        };
        const tokenResponse = await ZDClient.uploadImage(imagePayload);

        data.uploadUrl = tokenResponse.upload.url;
        data.token = tokenResponse.upload.token;
        const headers = tokenResponse.upload.headers;

        // Step 2: Upload Image (Regular Fetch)
        const requestOptions = {
          method: 'PUT',
          headers,
          body: data.selectedFile,
          redirect: 'follow',
        };
        await fetch(data.uploadUrl, requestOptions);

        await new Promise(resolve => setTimeout(resolve, 1000));

        // Step 3: Create Image Path
        const pathPayload = {
          token: data.token,
          brand_id: data.selectedBrandId.toString(),
        };
        const pathResponse = await ZDClient.createImagePath(pathPayload);

        const selectedbrand = data.allBrands.find(brand => brand.id === data.selectedBrandId);
        data.imagePath = `${selectedbrand.brand_url}${pathResponse.user_image.path}`;
      } catch (error) {
        console.error('Error uploading image:', error);
      } finally {
        data.isLoading = false;
        data.isCompleted = true;
      }
    }

    /**
     * Copy Image Path to Clipboard
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

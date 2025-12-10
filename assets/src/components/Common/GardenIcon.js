const template = `
  <svg 
    class="c-btn__icon" 
    :color="color"
    :role="role"
    :aria-labelledby="icon">
    <title :id="name || icon" >{{ name || icon }} Icon</title>
    <desc>{{ iconDescription || name }}</desc>
    <use :href="'./images/index.svg#' + icon">
  </use>
  </svg>
`;

const GardenIcon = {
  template,
  props: {
    icon: {
      type: String,
      default: '',
    },
    color: {
      type: String,
      default: '#bdbdbd',
    },
    role: {
      type: String,
      required: true,
    },
    iconDescription: {
      type: String,
      default: '',
    },
    name: {
      type: String,
      default: '',
    },
  },
};

export default GardenIcon;

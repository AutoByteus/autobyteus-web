import { mount } from '@vue/test-utils';
import PromptEditor from '../PromptEditor.vue';

describe('PromptEditor.vue', () => {
  it('renders correctly', () => {
    const wrapper = mount(PromptEditor, {
      props: {
        template: 'Hello {{name}}'
      }
    });
    expect(wrapper.html()).toContain('Hello');
    expect(wrapper.html()).toContain('<input');
  });

  it('renders correct number of segments', () => {
    const wrapper = mount(PromptEditor, {
      props: {
        template: 'Hello {{name}}, how are you {{time}}?'
      }
    });
    const segments = wrapper.findAll('span');
    expect(segments.length).toBe(3); // "Hello ", ", how are you ", "?"
  });

  it('renders correct number of input boxes', () => {
    const wrapper = mount(PromptEditor, {
      props: {
        template: 'Hello {{name}}, how are you {{time}}?'
      }
    });
    const inputs = wrapper.findAll('input');
    expect(inputs.length).toBe(2); // "{{name}}" and "{{time}}"
  });

  it('binds input boxes correctly to values ref', async () => {
    const wrapper = mount(PromptEditor, {
      props: {
        template: 'Hello {{name}}'
      }
    });
    const input = wrapper.find('input');
    await input.setValue('John');
    expect(wrapper.vm.values.name).toBe('John');
  });
});

import { mount } from '@vue/test-utils';
import TabList from '../TabList.vue';
import Tab from '../Tab.vue';
import { describe, it, expect } from 'vitest';

describe('TabList.vue', () => {

  // Sample tab data for testing
  const sampleTabs = [
    { name: 'Tab1' },
    { name: 'Tab2' },
    { name: 'Tab3' },
  ];

  it('renders the correct number of Tab components', () => {
    const wrapper = mount(TabList, {
      props: {
        tabs: sampleTabs,
        selectedTab: 'Tab1'
      }
    });

    // Expecting three Tab components
    expect(wrapper.findAllComponents(Tab).length).toBe(3);
  });

  it('passes the correct props to each Tab component', () => {
    const wrapper = mount(TabList, {
      props: {
        tabs: sampleTabs,
        selectedTab: 'Tab1'
      }
    });

    const tabs = wrapper.findAllComponents(Tab);
    for (let i = 0; i < sampleTabs.length; i++) {
      expect(tabs[i].props().name).toBe(sampleTabs[i].name);
      expect(tabs[i].props().selected).toBe(sampleTabs[i].name === 'Tab1');
    }
  });

  it('emits the select event with the correct tab name when a Tab is clicked', async () => {
    const wrapper = mount(TabList, {
      props: {
        tabs: sampleTabs,
        selectedTab: 'Tab1'
      }
    });

    // Simulating a click on the second tab
    await wrapper.findAllComponents(Tab)[1].trigger('click');

    // Expecting the emitted event's payload to be 'Tab2'
    expect(wrapper.emitted().select[0]).toEqual(['Tab2']);
  });

});

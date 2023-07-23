import { mount } from '@vue/test-utils';
import ExecutionLogsPanel from '../ExecutionLogsPanel.vue';
import { describe, it, expect } from 'vitest';

describe('ExecutionLogsPanel.vue', () => {

  // Test Rendering Title
  it('renders the title "Execution Logs:"', () => {
    const wrapper = mount(ExecutionLogsPanel);
    expect(wrapper.text()).toContain('Execution Logs:');
  });

  // Test Rendering Logs
  it('renders the logs from the logs prop', () => {
    const testLogs = "Sample logs for testing.";
    const wrapper = mount(ExecutionLogsPanel, {
      props: {
        logs: testLogs
      }
    });
    const preElement = wrapper.find('pre');
    expect(preElement.exists()).toBe(true);
    expect(preElement.text()).toBe(testLogs);
  });

  // Test Without Logs
  it('does not render the <pre> tag when logs prop is not provided', () => {
    const wrapper = mount(ExecutionLogsPanel);
    const preElement = wrapper.find('pre');
    expect(preElement.exists()).toBe(false);
  });

});

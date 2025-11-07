import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import SessionInfo from './SessionInfo.vue';

describe('SessionInfo', () => {
  it('displays session code correctly', () => {
    const wrapper = mount(SessionInfo, {
      props: {
        sessionCode: 'ABC123',
        currentRound: 1
      }
    });

    expect(wrapper.find('.session-code').text()).toBe('Session: ABC123');
  });

  it('displays current round correctly', () => {
    const wrapper = mount(SessionInfo, {
      props: {
        sessionCode: 'ABC123',
        currentRound: 5
      }
    });

    expect(wrapper.find('.round-info').text()).toBe('Round 5');
  });

  it('updates when props change', async () => {
    const wrapper = mount(SessionInfo, {
      props: {
        sessionCode: 'ABC123',
        currentRound: 1
      }
    });

    expect(wrapper.find('.round-info').text()).toBe('Round 1');

    await wrapper.setProps({ currentRound: 2 });

    expect(wrapper.find('.round-info').text()).toBe('Round 2');
  });

  it('handles different session code formats', () => {
    const testCases = ['ABC123', 'XYZ789', '123456'];

    testCases.forEach(code => {
      const wrapper = mount(SessionInfo, {
        props: {
          sessionCode: code,
          currentRound: 1
        }
      });

      expect(wrapper.find('.session-code').text()).toBe(`Session: ${code}`);
    });
  });
});

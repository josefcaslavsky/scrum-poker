import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import VotingTimer from './VotingTimer.vue';

describe('VotingTimer', () => {
  it('renders timer with correct seconds', () => {
    const wrapper = mount(VotingTimer, {
      props: {
        seconds: 15,
        progress: 100,
        timerColor: '#4caf50',
        votedCount: 2,
        totalCount: 5
      }
    });

    expect(wrapper.find('.timer-value').text()).toBe('15s');
  });

  it('displays voting status correctly', () => {
    const wrapper = mount(VotingTimer, {
      props: {
        seconds: 10,
        progress: 66,
        timerColor: '#4caf50',
        votedCount: 3,
        totalCount: 5
      }
    });

    expect(wrapper.find('.voting-status').text()).toBe('3 / 5 voted');
  });

  it('applies correct timer color', () => {
    const wrapper = mount(VotingTimer, {
      props: {
        seconds: 5,
        progress: 33,
        timerColor: '#f44336',
        votedCount: 1,
        totalCount: 5
      }
    });

    expect(wrapper.find('.timer-value').attributes('style')).toContain('color: #f44336');
  });

  it('shows progress bar with correct width', () => {
    const wrapper = mount(VotingTimer, {
      props: {
        seconds: 10,
        progress: 66.67,
        timerColor: '#4caf50',
        votedCount: 2,
        totalCount: 5
      }
    });

    const progressBar = wrapper.find('.timer-progress');
    expect(progressBar.attributes('style')).toContain('width: 66.67%');
  });

  it('shows progress bar with correct background color', () => {
    const wrapper = mount(VotingTimer, {
      props: {
        seconds: 10,
        progress: 66.67,
        timerColor: '#ffc107',
        votedCount: 2,
        totalCount: 5
      }
    });

    const progressBar = wrapper.find('.timer-progress');
    expect(progressBar.attributes('style')).toContain('background-color: #ffc107');
  });

  it('handles zero seconds', () => {
    const wrapper = mount(VotingTimer, {
      props: {
        seconds: 0,
        progress: 0,
        timerColor: '#f44336',
        votedCount: 5,
        totalCount: 5
      }
    });

    expect(wrapper.find('.timer-value').text()).toBe('0s');
  });
});

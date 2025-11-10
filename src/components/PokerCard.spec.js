import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PokerCard from './PokerCard.vue';

describe('PokerCard', () => {
  it('renders card with correct label', () => {
    const wrapper = mount(PokerCard, {
      props: {
        value: 5,
        label: '5'
      }
    });

    expect(wrapper.find('.card-value').text()).toBe('5');
  });

  it('shows selected state when isSelected is true', () => {
    const wrapper = mount(PokerCard, {
      props: {
        value: 5,
        label: '5',
        isSelected: true
      }
    });

    expect(wrapper.find('.poker-card').classes()).toContain('selected');
  });

  it('shows disabled state when disabled is true', () => {
    const wrapper = mount(PokerCard, {
      props: {
        value: 5,
        label: '5',
        disabled: true
      }
    });

    expect(wrapper.find('.poker-card').classes()).toContain('disabled');
  });

  it('emits select event when clicked and not disabled', async () => {
    const wrapper = mount(PokerCard, {
      props: {
        value: 5,
        label: '5',
        disabled: false
      }
    });

    await wrapper.find('.poker-card').trigger('click');

    expect(wrapper.emitted('select')).toBeTruthy();
    expect(wrapper.emitted('select')[0]).toEqual([5]);
  });

  it('does not emit select event when clicked and disabled', async () => {
    const wrapper = mount(PokerCard, {
      props: {
        value: 5,
        label: '5',
        disabled: true
      }
    });

    await wrapper.find('.poker-card').trigger('click');

    expect(wrapper.emitted('select')).toBeFalsy();
  });

  it('renders special card labels correctly', () => {
    const testCases = [
      { value: -1, label: '?' },
      { value: -2, label: '☕' },
      { value: 0.5, label: '½' }
    ];

    testCases.forEach(({ value, label }) => {
      const wrapper = mount(PokerCard, {
        props: { value, label }
      });

      expect(wrapper.find('.card-value').text()).toBe(label);
    });
  });

  it('shows card back pattern', () => {
    const wrapper = mount(PokerCard, {
      props: {
        value: 5,
        label: '5'
      }
    });

    expect(wrapper.find('.card-pattern').text()).toBe('🃏');
  });
});

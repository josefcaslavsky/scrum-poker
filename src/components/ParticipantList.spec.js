import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ParticipantList from './ParticipantList.vue';

describe('ParticipantList', () => {
  const mockParticipants = [
    { id: 1, name: 'Alice', emoji: '👩', hasVoted: true },
    { id: 2, name: 'Bob', emoji: '👨', hasVoted: false },
    { id: 3, name: 'Charlie', emoji: '🧑', hasVoted: true }
  ];

  it('renders all participants', () => {
    const wrapper = mount(ParticipantList, {
      props: {
        participants: mockParticipants
      }
    });

    const participants = wrapper.findAll('.participant');
    expect(participants).toHaveLength(3);
  });

  it('displays participant count in header', () => {
    const wrapper = mount(ParticipantList, {
      props: {
        participants: mockParticipants
      }
    });

    expect(wrapper.find('h3').text()).toBe('Participants (3)');
  });

  it('shows participant names and emojis', () => {
    const wrapper = mount(ParticipantList, {
      props: {
        participants: mockParticipants
      }
    });

    const html = wrapper.html();

    // Check that all participant data is rendered
    expect(html).toContain('👩');
    expect(html).toContain('Alice');
    expect(html).toContain('👨');
    expect(html).toContain('Bob');
    expect(html).toContain('🧑');
    expect(html).toContain('Charlie');
  });

  it('shows voted status correctly', () => {
    const wrapper = mount(ParticipantList, {
      props: {
        participants: mockParticipants
      }
    });

    const participants = wrapper.findAll('.participant');

    // Alice has voted
    expect(participants[0].classes()).toContain('voted');
    expect(participants[0].find('.participant-status').text()).toBe('✓');

    // Bob has not voted
    expect(participants[1].classes()).not.toContain('voted');
    expect(participants[1].find('.participant-status').text()).toBe('⏱');

    // Charlie has voted
    expect(participants[2].classes()).toContain('voted');
    expect(participants[2].find('.participant-status').text()).toBe('✓');
  });

  it('handles empty participant list', () => {
    const wrapper = mount(ParticipantList, {
      props: {
        participants: []
      }
    });

    expect(wrapper.find('h3').text()).toBe('Participants (0)');
    expect(wrapper.findAll('.participant')).toHaveLength(0);
  });

  it('handles single participant', () => {
    const wrapper = mount(ParticipantList, {
      props: {
        participants: [mockParticipants[0]]
      }
    });

    expect(wrapper.find('h3').text()).toBe('Participants (1)');
    expect(wrapper.findAll('.participant')).toHaveLength(1);
  });
});

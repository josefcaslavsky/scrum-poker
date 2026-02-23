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

  describe('Remove participant button', () => {
    it('shows remove buttons for facilitator (excluding current user)', () => {
      const wrapper = mount(ParticipantList, {
        props: {
          participants: mockParticipants,
          isFacilitator: true,
          currentUserId: 1
        }
      });

      // Alice (id:1) is current user, so no button for her. Bob and Charlie get buttons.
      expect(wrapper.findAll('.remove-btn')).toHaveLength(2);
    });

    it('hides remove buttons when user is not facilitator', () => {
      const wrapper = mount(ParticipantList, {
        props: {
          participants: mockParticipants,
          isFacilitator: false,
          currentUserId: 1
        }
      });

      expect(wrapper.findAll('.remove-btn')).toHaveLength(0);
    });

    it('hides remove button for current user own entry', () => {
      const wrapper = mount(ParticipantList, {
        props: {
          participants: mockParticipants,
          isFacilitator: true,
          currentUserId: 1
        }
      });

      // Alice (id:1) is the current user - her entry should have no remove button
      const aliceEntry = wrapper.findAll('.participant')[0];
      expect(aliceEntry.find('.remove-btn').exists()).toBe(false);
    });

    it('hides remove button for current user when id is passed as string', () => {
      const wrapper = mount(ParticipantList, {
        props: {
          participants: mockParticipants,
          isFacilitator: true,
          currentUserId: '1'
        }
      });

      const aliceEntry = wrapper.findAll('.participant')[0];
      expect(aliceEntry.find('.remove-btn').exists()).toBe(false);
    });

    it('emits remove-participant event with participant id when button clicked', async () => {
      const wrapper = mount(ParticipantList, {
        props: {
          participants: mockParticipants,
          isFacilitator: true,
          currentUserId: 1
        }
      });

      // Click the first remove button (Bob, id:2)
      await wrapper.findAll('.remove-btn')[0].trigger('click');

      expect(wrapper.emitted('remove-participant')).toBeTruthy();
      expect(wrapper.emitted('remove-participant')[0]).toEqual([2]);
    });

    it('shows remove button with correct aria-label', () => {
      const wrapper = mount(ParticipantList, {
        props: {
          participants: mockParticipants,
          isFacilitator: true,
          currentUserId: 1
        }
      });

      const buttons = wrapper.findAll('.remove-btn');
      expect(buttons[0].attributes('aria-label')).toBe('Remove Bob from session');
      expect(buttons[1].attributes('aria-label')).toBe('Remove Charlie from session');
    });

    it('disables remove button when removingParticipantId matches', () => {
      const wrapper = mount(ParticipantList, {
        props: {
          participants: mockParticipants,
          isFacilitator: true,
          currentUserId: 1,
          removingParticipantId: 2
        }
      });

      const buttons = wrapper.findAll('.remove-btn');
      // Bob (id:2) button should be disabled
      expect(buttons[0].attributes('disabled')).toBeDefined();
      // Charlie (id:3) button should not be disabled
      expect(buttons[1].attributes('disabled')).toBeUndefined();
    });
  });
});

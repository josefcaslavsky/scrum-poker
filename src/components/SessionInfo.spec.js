import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

  describe('share button', () => {
    let originalNavigator;

    beforeEach(() => {
      originalNavigator = { ...navigator };
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    function mountSessionInfo(code = 'ABC123') {
      return mount(SessionInfo, {
        props: { sessionCode: code, currentRound: 1 }
      });
    }

    function getShareButton(wrapper) {
      // Share button is the second .copy-btn
      const buttons = wrapper.findAll('.copy-btn');
      return buttons[1];
    }

    it('renders the share button', () => {
      const wrapper = mountSessionInfo();
      const buttons = wrapper.findAll('.copy-btn');
      expect(buttons).toHaveLength(2);
      expect(buttons[1].text()).toContain('🔗');
    });

    it('uses navigator.share when available', async () => {
      const shareMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', {
        value: shareMock,
        writable: true,
        configurable: true
      });

      const wrapper = mountSessionInfo('TEST01');
      await getShareButton(wrapper).trigger('click');

      expect(shareMock).toHaveBeenCalledWith({
        title: 'Join Scrum Poker',
        url: expect.stringContaining('?join=TEST01')
      });

      // Clean up
      delete navigator.share;
    });

    it('falls back to clipboard when navigator.share is not available', async () => {
      // Ensure share is not defined
      const shareDescriptor = Object.getOwnPropertyDescriptor(navigator, 'share');
      if (shareDescriptor) {
        Object.defineProperty(navigator, 'share', {
          value: undefined,
          writable: true,
          configurable: true
        });
      }

      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true
      });

      const wrapper = mountSessionInfo('XYZ789');
      await getShareButton(wrapper).trigger('click');

      expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining('?join=XYZ789'));

      // Clean up
      if (shareDescriptor) {
        Object.defineProperty(navigator, 'share', shareDescriptor);
      }
    });

    it('falls back to clipboard when navigator.share rejects (non-abort)', async () => {
      const shareMock = vi.fn().mockRejectedValue(new Error('Share failed'));
      Object.defineProperty(navigator, 'share', {
        value: shareMock,
        writable: true,
        configurable: true
      });

      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true
      });

      const wrapper = mountSessionInfo('ABC123');
      await getShareButton(wrapper).trigger('click');

      expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining('?join=ABC123'));

      // Clean up
      delete navigator.share;
    });

    it('does not fall back to clipboard when user cancels share (AbortError)', async () => {
      const abortError = new DOMException('Share cancelled', 'AbortError');
      const shareMock = vi.fn().mockRejectedValue(abortError);
      Object.defineProperty(navigator, 'share', {
        value: shareMock,
        writable: true,
        configurable: true
      });

      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true
      });

      const wrapper = mountSessionInfo('ABC123');
      await getShareButton(wrapper).trigger('click');

      expect(writeTextMock).not.toHaveBeenCalled();

      // Clean up
      delete navigator.share;
    });

    it('shows checkmark after clipboard copy and resets after 2 seconds', async () => {
      Object.defineProperty(navigator, 'share', {
        value: undefined,
        writable: true,
        configurable: true
      });

      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true
      });

      const wrapper = mountSessionInfo();
      const shareBtn = getShareButton(wrapper);

      expect(shareBtn.text()).toContain('🔗');

      await shareBtn.trigger('click');
      // Wait for async clipboard call to resolve
      await vi.dynamicImportSettled();

      expect(shareBtn.text()).toContain('✓');

      vi.advanceTimersByTime(2000);
      await wrapper.vm.$nextTick();

      expect(shareBtn.text()).toContain('🔗');

      // Clean up
      delete navigator.share;
    });

    it('includes session code in the shared link', async () => {
      Object.defineProperty(navigator, 'share', {
        value: undefined,
        writable: true,
        configurable: true
      });

      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true
      });

      const wrapper = mountSessionInfo('MYCODE');
      await getShareButton(wrapper).trigger('click');

      const copiedUrl = writeTextMock.mock.calls[0][0];
      const url = new URL(copiedUrl);
      expect(url.searchParams.get('join')).toBe('MYCODE');

      // Clean up
      delete navigator.share;
    });
  });
});

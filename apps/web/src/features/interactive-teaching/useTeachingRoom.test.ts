import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import type { createTeachingRealtimeClient } from './teachingRealtimeClient'
import { useTeachingRoom } from './useTeachingRoom'

describe('useTeachingRoom', () => {
  it('keeps the single-tab fallback when no room query is present', async () => {
    const wrapper = mount(
      defineComponent({
        setup() {
          return useTeachingRoom({})
        },
        template: '<div>{{ realtimeStatusText }}</div>',
      }),
    )

    await flushPromises()

    expect(wrapper.text()).toContain('实时连接未启用')
  })

  it('connects room queries and sends realtime events while preserving local state', async () => {
    const sentEvents: unknown[] = []
    let statusCallback: ((status: 'connecting' | 'connected' | 'unavailable') => void) | undefined
    const fakeClient = {
      connect: vi.fn(),
      close: vi.fn(),
      sendEvent: vi.fn((event: unknown) => {
        sentEvents.push(event)
        return true
      }),
    }
    const createClient = vi.fn((options) => {
      statusCallback = options.onStatus
      return fakeClient
    }) as unknown as typeof createTeachingRealtimeClient

    const wrapper = mount(
      defineComponent({
        setup() {
          const room = useTeachingRoom(
            { room: 'demo', persona: 'teacher' },
            { origin: 'http://127.0.0.1:5174', clientId: 'teacher-tab', createClient },
          )

          function focusTeacher() {
            room.updateSession(
              { ...room.session.value, teacherFocus: true },
              { type: 'set-teacher-focus', enabled: true },
            )
          }

          return { session: room.session, realtimeStatusText: room.realtimeStatusText, focusTeacher }
        },
        template: '<button data-testid="focus" @click="focusTeacher">{{ session.teacherFocus }} {{ realtimeStatusText }}</button>',
      }),
    )

    await flushPromises()
    statusCallback?.('unavailable')
    await flushPromises()
    await wrapper.get('[data-testid="focus"]').trigger('click')

    expect(createClient).toHaveBeenCalledWith(
      expect.objectContaining({
        roomId: 'demo',
        clientId: 'teacher-tab',
        persona: 'teacher',
      }),
    )
    expect(fakeClient.connect).toHaveBeenCalled()
    expect(wrapper.text()).toContain('实时连接不可用，本地演示')
    expect(wrapper.text()).toContain('true')
    expect(sentEvents).toEqual([{ type: 'set-teacher-focus', enabled: true }])
  })
})

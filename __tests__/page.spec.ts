import {
  definePage,
  ref,
  reactive,
  computed,
  readonly,
  watch,
  nextTick,
  onReady,
  onShow,
  onHide,
  onUnload,
  onPullDownRefresh,
  onReachBottom,
  onResize,
  onTabItemTap,
  onPageScroll,
  onShareAppMessage
} from '../src'
import { mockWarn } from './mock-warn'

// Mocks
declare global {
  namespace NodeJS {
    interface Global {
      Page: (options: Record<string, any>) => void
    }
  }
}
let page: Record<string, any>
global.Page = (options: Record<string, any>) => {
  page = {
    ...options,
    is: '',
    route: '',
    options: {},
    setData(data: Record<string, unknown>) {
      this.data = this.data || {}
      Object.keys(data).forEach(key => {
        this.data[key] = data[key]
      })
    }
  }
}

describe('page', () => {
  mockWarn()

  it('raw binding', () => {
    definePage(() => {
      const count = 0
      return { count }
    })
    page.onLoad()
    expect(page.data.count).toBe(0)
  })

  it('ref binding', async () => {
    definePage(() => {
      const count = ref(0)
      const double = computed(() => count.value * 2)
      const increment = (): void => {
        count.value++
      }

      const add = ref(increment)

      return {
        add,
        count,
        double,
        increment
      }
    })
    page.onLoad()
    expect(page.data.count).toBe(0)
    expect(page.data.double).toBe(0)
    expect(page.data.add).toBeInstanceOf(Function)

    page.increment()
    await nextTick()
    expect(page.data.count).toBe(1)
    expect(page.data.double).toBe(2)
  })

  it('reactive binding', async () => {
    definePage(() => {
      const state: { count: number; double: number } = reactive({
        count: 0,
        double: computed(() => state.count * 2)
      })
      const increment = (): void => {
        state.count++
      }

      return {
        state,
        increment
      }
    })
    page.onLoad()
    expect(page.data.state).toEqual({ count: 0, double: 0 })

    page.increment()
    await nextTick()
    expect(page.data.state).toEqual({ count: 1, double: 2 })
  })

  it('readonly binding', () => {
    definePage(() => {
      const state = readonly({ count: 0 })
      return { state }
    })
    page.onLoad()
    expect(page.data.state).toEqual({ count: 0 })
  })

  it('array binding', async () => {
    definePage(() => {
      const count = ref(0)
      const double = computed(() => count.value * 2)
      const increment = (): void => {
        count.value++
      }

      return {
        arr: [count, double],
        increment
      }
    })
    page.onLoad()
    expect(page.data.arr).toEqual([0, 0])

    page.increment()
    await nextTick()
    expect(page.data.arr).toEqual([1, 2])
  })

  it('object binding', async () => {
    definePage(() => {
      const count = ref(0)
      const double = computed(() => count.value * 2)
      const increment = (): void => {
        count.value++
      }

      return {
        obj: { count, double },
        increment
      }
    })
    page.onLoad()
    expect(page.data.obj).toEqual({ count: 0, double: 0 })

    page.increment()
    await nextTick()
    expect(page.data.obj).toEqual({ count: 1, double: 2 })
  })

  it('error binding', () => {
    definePage(() => {
      const sym = Symbol('sym')
      return { sym }
    })
    expect(() => page.onLoad()).toThrow('Symbol value is not supported')
  })

  it('unbundling', async () => {
    definePage(() => {
      const count = ref(0)
      const double = computed(() => count.value * 2)
      const increment = (): void => {
        count.value++
      }

      return {
        count,
        double,
        increment
      }
    })
    page.onLoad()
    page.onUnload()
    page.increment()
    await nextTick()
    expect(page.data.count).toBe(0)
    expect(page.data.double).toBe(0)
  })

  it('watch', async () => {
    let dummy: number
    let stopper: () => void
    definePage(() => {
      const count = ref(0)
      const increment = (): void => {
        count.value++
      }

      stopper = watch(() => {
        dummy = count.value
      })
      return {
        count,
        increment
      }
    })
    page.onLoad()
    await nextTick()
    expect(dummy!).toBe(0)
    expect(page.data.count).toBe(0)
    // The other is `count` sync watcher
    expect(page.__effects__.length).toBe(2)

    page.increment()
    await nextTick()
    expect(dummy!).toBe(1)
    expect(page.data.count).toBe(1)

    stopper!()
    stopper!()
    page.increment()
    await nextTick()
    expect(dummy!).toBe(1)
    expect(page.data.count).toBe(2)
    expect(page.__effects__.length).toBe(1)
  })

  it('onLoad', () => {
    const arg = {}
    const onLoad = jest.fn()
    const setup = jest.fn()
    definePage({ onLoad, setup })
    page.onLoad(arg)
    expect(onLoad).toBeCalledWith(arg)
    expect(setup).toBeCalledWith(arg, { is: '', route: '', options: {} })
  })

  it('onReady', () => {
    onReady(() => {})
    expect('onReady() hook can only').toHaveBeenWarned()

    const fn = jest.fn()
    const injectedFn1 = jest.fn()
    const injectedFn2 = jest.fn()
    definePage({
      onReady: fn,
      setup() {
        onReady(injectedFn1)
        onReady(injectedFn2)
      }
    })
    page.onLoad()
    page.onReady()
    expect(fn).toBeCalledTimes(1)
    expect(injectedFn1).toBeCalledTimes(1)
    expect(injectedFn2).toBeCalledTimes(1)
  })

  it('onShow', () => {
    const fn = jest.fn()
    const injectedFn1 = jest.fn()
    const injectedFn2 = jest.fn()
    definePage({
      onShow: fn,
      setup() {
        onShow(injectedFn1)
        onShow(injectedFn2)
      }
    })
    page.onLoad()
    page.onShow()
    expect(fn).toBeCalledTimes(1)
    expect(injectedFn1).toBeCalledTimes(1)
    expect(injectedFn2).toBeCalledTimes(1)
  })

  it('onHide', () => {
    const fn = jest.fn()
    const injectedFn1 = jest.fn()
    const injectedFn2 = jest.fn()
    definePage({
      onHide: fn,
      setup() {
        onHide(injectedFn1)
        onHide(injectedFn2)
      }
    })
    page.onLoad()
    page.onHide()
    expect(fn).toBeCalledTimes(1)
    expect(injectedFn1).toBeCalledTimes(1)
    expect(injectedFn2).toBeCalledTimes(1)
  })

  it('onUnload', async () => {
    const fn = jest.fn()
    const injectedFn1 = jest.fn()
    const injectedFn2 = jest.fn()
    definePage({
      onUnload: fn,
      setup() {
        onUnload(injectedFn1)
        onUnload(injectedFn2)
      }
    })
    page.onLoad()
    page.onUnload()
    expect(fn).toBeCalledTimes(1)
    expect(injectedFn1).toBeCalledTimes(1)
    expect(injectedFn2).toBeCalledTimes(1)
  })

  it('onPullDownRefresh', () => {
    const fn = jest.fn()
    const injectedFn1 = jest.fn()
    const injectedFn2 = jest.fn()
    definePage({
      onPullDownRefresh: fn,
      setup() {
        onPullDownRefresh(injectedFn1)
        onPullDownRefresh(injectedFn2)
      }
    })
    page.onLoad()
    page.onPullDownRefresh()
    expect(fn).toBeCalledTimes(1)
    expect(injectedFn1).toBeCalledTimes(1)
    expect(injectedFn2).toBeCalledTimes(1)
  })

  it('onReachBottom', () => {
    const fn = jest.fn()
    const injectedFn1 = jest.fn()
    const injectedFn2 = jest.fn()
    definePage({
      onReachBottom: fn,
      setup() {
        onReachBottom(injectedFn1)
        onReachBottom(injectedFn2)
      }
    })
    page.onLoad()
    page.onReachBottom()
    expect(fn).toBeCalledTimes(1)
    expect(injectedFn1).toBeCalledTimes(1)
    expect(injectedFn2).toBeCalledTimes(1)
  })

  it('onResize', () => {
    const arg = {}
    const fn = jest.fn()
    const injectedFn1 = jest.fn()
    const injectedFn2 = jest.fn()
    definePage({
      onResize: fn,
      setup() {
        onResize(injectedFn1)
        onResize(injectedFn2)
      }
    })
    page.onLoad()
    page.onResize(arg)
    expect(fn).toBeCalledWith(arg)
    expect(injectedFn1).toBeCalledWith(arg)
    expect(injectedFn2).toBeCalledWith(arg)
  })

  it('onTabItemTap', () => {
    const arg = {}
    const fn = jest.fn()
    const injectedFn1 = jest.fn()
    const injectedFn2 = jest.fn()
    definePage({
      onTabItemTap: fn,
      setup() {
        onTabItemTap(injectedFn1)
        onTabItemTap(injectedFn2)
      }
    })
    page.onLoad()
    page.onTabItemTap(arg)
    expect(fn).toBeCalledWith(arg)
    expect(injectedFn1).toBeCalledWith(arg)
    expect(injectedFn2).toBeCalledWith(arg)
  })

  it('onPageScroll', () => {
    onPageScroll(() => {})
    expect('Page specific lifecycle').toHaveBeenWarned()

    definePage(() => {
      onPageScroll(() => {})
    })
    page.onLoad()
    expect('onPageScroll() hook only').toHaveBeenWarned()

    const arg = {}
    const fn = jest.fn()
    const injectedFn1 = jest.fn()
    const injectedFn2 = jest.fn()
    definePage({
      onPageScroll: fn,
      setup() {
        onPageScroll(injectedFn1)
        onPageScroll(injectedFn2)
      }
    })
    page.onLoad()
    page.onPageScroll(arg)
    expect(fn).toBeCalledWith(arg)
    expect(injectedFn1).toBeCalledWith(arg)
    expect(injectedFn2).toBeCalledWith(arg)

    const injectedFn = jest.fn()
    definePage(
      () => {
        onPageScroll(injectedFn)
      },
      { listenPageScroll: true }
    )
    page.onLoad()
    page.onPageScroll(arg)
    expect(injectedFn).toBeCalledWith(arg)
  })

  it('onShareAppMessage', () => {
    onShareAppMessage(() => ({}))
    expect('Page specific lifecycle').toHaveBeenWarned()

    definePage({
      onShareAppMessage() {
        return {}
      },
      setup() {
        onShareAppMessage(() => ({}))
      }
    })
    page.onLoad()
    expect('onShareAppMessage() hook only').toHaveBeenWarned()

    definePage(() => {
      onShareAppMessage(() => ({}))
      onShareAppMessage(() => ({}))
    })
    page.onLoad()
    expect('onShareAppMessage() hook can only').toHaveBeenWarned()

    const arg = {}
    const fn = jest.fn(() => ({ title: 'test' }))
    definePage(() => {
      onShareAppMessage(fn)
    })
    page.onLoad()
    const shareContent = page.onShareAppMessage(arg)
    expect(fn).toBeCalledWith(arg)
    expect(shareContent).toEqual({ title: 'test' })

    definePage(() => {})
    expect(page.onShareAppMessage(arg)).toEqual({})
  })

  it('inject lifecycle outside setup', () => {
    onShow(() => {})
    expect('Page specific lifecycle').toHaveBeenWarned()
  })

  it('no setup', () => {
    const options = {}
    definePage(options)
    expect(page).toBeInstanceOf(Object)
  })
})

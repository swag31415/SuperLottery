class ConfettiGenerator {
  constructor(options) {
    const defaultOptions = {
      target: 'confetti-canvas',
      maxCount: 150,
      colors: ['#e6c84c', '#f48fb1', '#7ec8e3', '#feb144', '#a1c181', '#b9a0b9', '#80ced6'],
      shapes: ['circle', 'square'],
      size: 20,
      speed: 8,
      rotation: true,
      clock: 25,
    }

    this.options = Object.assign(defaultOptions, options)
    this.canvas = document.querySelector(`#${this.options.target}`)
    this.ctx = this.canvas.getContext('2d')
    this.width = this.canvas.width = window.innerWidth
    this.height = this.canvas.height = window.innerHeight
    this.running = false
    this.lastTime = 0

    this.particles = new Array(this.options.maxCount)
    for (let i = 0; i < this.options.maxCount; i++) {
      this.particles[i] = this.createParticle()
    }
  }

  createParticle() {
    const { colors, shapes, size, speed, rotation, clock } = this.options
    const x = Math.random() * this.width
    const y = -Math.random() * this.height
    const xv = (Math.random() - 0.5) * speed
    const yv = Math.random() * speed
    const color = colors[Math.floor(Math.random() * colors.length)]
    const shape = shapes[Math.floor(Math.random() * shapes.length)]
    const particleSize = Math.floor(Math.random() * size) + size
    const rotationAngle = rotation ? Math.random() * 360 : null
    const clockSpeed = Math.floor(Math.random() * clock)
    return { x, y, xv, yv, color, shape, size: particleSize, rotation: rotationAngle, clock: clockSpeed }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height)
    this.particles.forEach(particle => {
      this.ctx.save()
      this.ctx.translate(particle.x, particle.y)
      if (particle.rotation !== null) {
        this.ctx.rotate((particle.rotation * Math.PI) / 180)
      }
      this.ctx.fillStyle = particle.color
      if (particle.shape === 'circle') {
        this.ctx.beginPath()
        this.ctx.arc(0, 0, particle.size / 2, 0, 2 * Math.PI)
        this.ctx.fill()
      } else if (particle.shape === 'square') {
        this.ctx.fillRect(-particle.size / 2, -particle.size / 2,
          particle.size, particle.size)
      }
      this.ctx.restore()
    })
  }

  update() {
    this.particles.forEach(particle => {
      particle.x += particle.xv
      particle.y += particle.yv
      particle.rotation += particle.clock
      if (particle.y > this.height) {
        Object.assign(particle, this.createParticle())
      }
    })
  }

  render(timestamp) {
    if (!this.running) return
    if (!this.lastTime) this.lastTime = timestamp
    const elapsed = timestamp - this.lastTime
    if (elapsed > 16) {
      this.lastTime = timestamp
      this.draw()
      this.update()
    }
    requestAnimationFrame((ts) => this.render(ts))
  }

  start() {
    if (!this.running) {
      this.running = true
      this.render()
    }
  }

  stop() {
    this.running = false
    this.ctx.clearRect(0, 0, this.width, this.height);
  }
}

const { createApp } = Vue
const app = createApp({
  data() {
    return {
      winning_nums: ['', '', '', '', '', ''],
      our_nums: ['', '', '', '', '', ''],
      state: 'init',
      confetti: new ConfettiGenerator()
    }
  },
  methods: {
    gen_nums() {
      return [69, 69, 69, 69, 69, 26].map(n => Math.floor(Math.random() * n) + 1)
    },
    start() {
      this.pid = setInterval(() => {
        this.winning_nums = this.gen_nums()
        this.our_nums = this.gen_nums()
        if (this.winning_nums.every((v, i) => v == this.our_nums[i])) this.win()
      })
      this.state = 'playing'
    },
    win() {
      this.state = 'done'
      this.our_nums = this.winning_nums
      this.confetti.start()
      clearInterval(this.pid)
    },
    again() {
      this.confetti.stop()
      this.start()
    }
  }
}).mount('#app')
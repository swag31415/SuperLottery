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
      ticket_cost: 2,
      winning_nums: ['', '', '', '', '', ''],
      our_nums: ['', '', '', '', '', ''],
      state: 'init',
      confetti: new ConfettiGenerator(),
      last_check: {
        t: new Date(),
        k: 0,
      },
      stats: {
        plays_per_second: 0,
        plays: 0,
        _3_number_matches: 0,
        _4_number_matches: 0,
        _5_number_matches: 0,
        wins: 0,
        real_wins: 0,
        cost_per_second: 0,
        total_cost: 0,
        total_won: 0,
        cost_to_won_ratio: 0,
        time_started: new Date(),
      },
      base_pool: Array.from({length: 69}).map((_,i) => i+1)
    }
  },
  methods: {
    shuffle_arr(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
    },
    gen_nums() {
      this.shuffle_arr(this.base_pool)
      return [this.base_pool[0], this.base_pool[1], this.base_pool[2], this.base_pool[3], this.base_pool[4], Math.floor(Math.random() * 26) + 1]
    },
    compare(a1, a2) {
      let matches = 0
      for (let i = 0; i < 5; i++) {
        if (a1[i] === a2[i]) matches++
      }
      return {base: matches, power: a1[5] === a2[5]}
    },
    start() {
      this.pid = setInterval(() => {
        this.stats.plays++
        this.stats.total_cost += this.ticket_cost
        if (new Date() - this.last_check.t > 1000) {
          this.last_check.t = new Date()
          this.stats.plays_per_second = this.stats.plays - this.last_check.k
          this.stats.cost_per_second = this.stats.plays_per_second * this.ticket_cost
          this.last_check.k = this.stats.plays
          this.stats.cost_to_won_ratio = this.get_ratio(this.stats.total_cost, this.stats.total_won)
        }
        this.winning_nums = this.gen_nums()
        this.our_nums = this.gen_nums()
        let m = this.compare(this.winning_nums, this.our_nums)
        switch (m.base) {
          case 6:
            this.stats.real_wins++
            this.win()
            return;
          case 5: this.stats._5_number_matches++
          case 4: this.stats._4_number_matches++
          case 3: this.stats._3_number_matches++
        }
        this.stats.total_won += this.get_payout(m.base, m.power)
      })
      this.state = 'playing'
    },
    win() {
      this.stats.wins++
      this.stats.total_won += this.get_payout(5, 1)
      this.state = 'done'
      this.our_nums = this.winning_nums
      this.confetti.start()
      clearInterval(this.pid)
    },
    again() {
      this.confetti.stop()
      this.start()
    },
    time_since(date) {
      const seconds = Math.floor((new Date() - date) / 1000);
      const intervals = [
        { label: "year", seconds: 31536000 },
        { label: "month", seconds: 2592000 },
        { label: "day", seconds: 86400 },
        { label: "hour", seconds: 3600 },
        { label: "minute", seconds: 60 },
        { label: "second", seconds: 1 },
      ];
      for (const interval of intervals) {
        const count = Math.floor(seconds / interval.seconds);
        if (count >= 1) {
          const label = count === 1 ? interval.label : `${interval.label}s`;
          return `${count} ${label}`;
        }
      }
    },
    simp_num(num) {
      const abbreviations = [
        { value: 1e24, label: " septillion" },
        { value: 1e21, label: " sextillion" },
        { value: 1e18, label: " quintillion" },
        { value: 1e15, label: " quadrillion" },
        { value: 1e12, label: " trillion" },
        { value: 1e9, label: "b" },
        { value: 1e6, label: "m" },
        { value: 1e3, label: "k" },
      ];
      for (const abbreviation of abbreviations) {
        if (num >= abbreviation.value) {
          const simplified = Math.floor(num / abbreviation.value);
          return `${simplified}${abbreviation.label}`;
        }
      }
      return num.toString();
    },
    get_payout(n_matches, powerball_matched) {
      const payouts = [0, 0, 0, 4, 100, 1000000, 4, 4, 7, 100, 50000, 141000000]
      return payouts[powerball_matched ? n_matches + 6 : n_matches]
    },
    money(n) {
      return n + ' dollars'
    },
    get_ratio(n1, n2) {
      const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b))
      const divisor = gcd(n1, n2)
      return `${this.simp_num(n1 / divisor)} to ${this.simp_num(n2 / divisor)}`
    },    
  }
}).mount('#app')
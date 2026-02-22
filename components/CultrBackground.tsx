'use client'

import { useEffect, useRef } from 'react'

const FILM_GRAIN_SHADER = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uIntensity: { value: 0.04 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uIntensity;
    varying vec2 vUv;
    float hash(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }
    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      float grain = hash(vUv * 900.0 + uTime * 100.0) * 2.0 - 1.0;
      color.rgb += grain * uIntensity;
      float vig = 1.0 - 0.3 * pow(length((vUv - 0.5) * vec2(1.5, 1.05)), 2.2);
      color.rgb *= vig;
      gl_FragColor = color;
    }
  `,
}

const FXAA_SHADER = {
  uniforms: {
    tDiffuse: { value: null },
    uResolution: { value: null },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec2 uResolution;
    varying vec2 vUv;

    void main() {
      vec2 px = 1.0 / uResolution;

      float lumC = dot(texture2D(tDiffuse, vUv).rgb, vec3(0.299, 0.587, 0.114));
      float lumN = dot(texture2D(tDiffuse, vUv + vec2(0.0, px.y)).rgb, vec3(0.299, 0.587, 0.114));
      float lumS = dot(texture2D(tDiffuse, vUv - vec2(0.0, px.y)).rgb, vec3(0.299, 0.587, 0.114));
      float lumE = dot(texture2D(tDiffuse, vUv + vec2(px.x, 0.0)).rgb, vec3(0.299, 0.587, 0.114));
      float lumW = dot(texture2D(tDiffuse, vUv - vec2(px.x, 0.0)).rgb, vec3(0.299, 0.587, 0.114));

      float lumMin = min(lumC, min(min(lumN, lumS), min(lumE, lumW)));
      float lumMax = max(lumC, max(max(lumN, lumS), max(lumE, lumW)));
      float lumRange = lumMax - lumMin;

      if (lumRange < max(0.0312, lumMax * 0.125)) {
        gl_FragColor = texture2D(tDiffuse, vUv);
        return;
      }

      vec2 dir = vec2(-(lumN - lumS), lumE - lumW);
      float dirReduce = max((lumN + lumS + lumE + lumW) * 0.03125, 0.0078125);
      float rcpDirMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);
      dir = clamp(dir * rcpDirMin, -8.0, 8.0) * px;

      vec3 a = 0.5 * (
        texture2D(tDiffuse, vUv + dir * (1.0/3.0 - 0.5)).rgb +
        texture2D(tDiffuse, vUv + dir * (2.0/3.0 - 0.5)).rgb
      );
      vec3 b = a * 0.5 + 0.25 * (
        texture2D(tDiffuse, vUv + dir * -0.5).rgb +
        texture2D(tDiffuse, vUv + dir *  0.5).rgb
      );

      float lumB = dot(b, vec3(0.299, 0.587, 0.114));
      gl_FragColor = vec4((lumB < lumMin || lumB > lumMax) ? a : b, 1.0);
    }
  `,
}

const VERTEX_SHADER = /* glsl */ `
precision highp float;
uniform float uTime;
uniform vec2 uPointer;
uniform float uPointerStrength;

varying float vDisplacement;
varying vec3 vNormal;
varying vec3 vWorldPos;
varying vec2 vUv;

vec4 permute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
  + i.y + vec4(0.0, i1.y, i2.y, 1.0))
  + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0/7.0;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  float f = 1.0;
  for (int i = 0; i < 4; i++) {
    v += a * snoise(p * f);
    a *= 0.48;
    f *= 2.05;
  }
  return v;
}

// Lightweight 2-octave version for normal sampling (3x faster than full fbm)
float fbm_fast(vec3 p) {
  return 0.5 * snoise(p) + 0.24 * snoise(p * 2.05);
}

float displace(vec3 p, float t) {
  float warp = snoise(vec3(p.x * 0.6, p.z * 0.6, t * 0.8)) * 0.4;
  vec3 wc = vec3(p.x * 0.7 + warp, p.z * 0.7 + warp * 0.7, t);
  float n = fbm(wc);
  n += 0.25 * snoise(vec3(p.x * 1.4 + t * 0.4, p.z * 1.4 - t * 0.2, t * 0.6));
  n += 0.12 * snoise(vec3(p.x * 3.0 - t * 0.3, p.z * 2.8 + t * 0.15, t * 1.2));
  return n * 0.38;
}

float displace_normal(vec3 p, float t) {
  float warp = snoise(vec3(p.x * 0.6, p.z * 0.6, t * 0.8)) * 0.4;
  vec3 wc = vec3(p.x * 0.7 + warp, p.z * 0.7 + warp * 0.7, t);
  return fbm_fast(wc) * 0.38;
}

void main() {
  vec3 pos = position;
  vUv = uv;
  float t = uTime * 0.10;

  float d = displace(pos, t);

  float pointerDist = length(pos.xz - uPointer * 2.0);
  float pointerWave = uPointerStrength * 0.18 * exp(-pointerDist * pointerDist * 0.6)
                    * sin(pointerDist * 5.0 - uTime * 2.5);
  d += pointerWave;
  pos.y += d;
  vDisplacement = d;

  float eps = 0.02;
  float hPx = displace_normal(vec3(position.x + eps, 0.0, position.z), t);
  float hNx = displace_normal(vec3(position.x - eps, 0.0, position.z), t);
  float hPz = displace_normal(vec3(position.x, 0.0, position.z + eps), t);
  float hNz = displace_normal(vec3(position.x, 0.0, position.z - eps), t);

  vec3 tangent = normalize(vec3(2.0 * eps, hPx - hNx, 0.0));
  vec3 bitangent = normalize(vec3(0.0, hPz - hNz, 2.0 * eps));
  vec3 computedNormal = normalize(cross(tangent, bitangent));

  vNormal = normalMatrix * computedNormal;
  vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`

const FRAGMENT_SHADER = /* glsl */ `
precision highp float;
uniform float uTime;

varying float vDisplacement;
varying vec3 vNormal;
varying vec3 vWorldPos;
varying vec2 vUv;

const vec3 forest   = vec3(0.169, 0.271, 0.259);
const vec3 deepTeal = vec3(0.133, 0.333, 0.318);
const vec3 mint     = vec3(0.843, 0.953, 0.863);
const vec3 white    = vec3(1.0);
const vec3 lightDir  = normalize(vec3(0.35, 1.0, 0.25));
const vec3 lightDir2 = normalize(vec3(-0.6, 0.4, -0.3));

float D_GGX(float NdotH, float roughness) {
  float a2 = roughness * roughness;
  float d = NdotH * NdotH * (a2 - 1.0) + 1.0;
  return a2 / (3.14159 * d * d + 0.0001);
}

vec3 iridescence(float cosTheta, float thickness) {
  float d = thickness * 2.0;
  vec3 phase = mod(d * cosTheta / vec3(650.0, 510.0, 475.0), 1.0);
  return 0.5 + 0.5 * cos(6.28318 * phase + vec3(0.0, 2.094, 4.189));
}

float caustics(vec2 p, float time) {
  float c = 0.0;
  vec2 uv = p * 3.0;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float t = time * (0.3 + fi * 0.1);
    vec2 offset = vec2(
      sin(uv.y * 2.5 + t + fi) * 0.3,
      cos(uv.x * 2.5 + t * 1.3 + fi) * 0.3
    );
    c += sin(dot(uv + offset, vec2(sin(t), cos(t))) * 4.0 + t);
  }
  return smoothstep(0.8, 1.0, abs(c / 3.0));
}

void main() {
  float h = smoothstep(-0.18, 0.30, vDisplacement);

  vec3 baseColor = mix(forest, deepTeal, smoothstep(0.0, 0.3, h));
  baseColor = mix(baseColor, mint, smoothstep(0.25, 0.65, h));
  baseColor = mix(baseColor, white, smoothstep(0.7, 1.0, h));

  vec3 norm = normalize(vNormal);
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  vec3 halfDir = normalize(lightDir + viewDir);

  float NdotL  = max(dot(norm, lightDir), 0.0);
  float NdotL2 = max(dot(norm, lightDir2), 0.0);
  float NdotH  = max(dot(norm, halfDir), 0.0);
  float NdotV  = max(dot(norm, viewDir), 0.0);

  float ambient = 0.30;
  float diffuse = NdotL * 0.55 + NdotL2 * 0.15;

  float roughness = mix(0.3, 0.65, 1.0 - h);
  float spec = D_GGX(NdotH, roughness);
  vec3 specColor = mix(mint, white, 0.7) * spec * 0.28 * smoothstep(0.2, 0.7, h);

  float sss = pow(max(dot(viewDir, -lightDir + norm * 0.6), 0.0), 3.0) * 0.12;
  vec3 sssColor = mint * sss;

  float fresnel = pow(1.0 - NdotV, 4.0);
  vec3 iriColor = iridescence(NdotV, 1.2 + h * 0.8);
  vec3 fresnelColor = mix(mint, iriColor * mint, 0.5) * fresnel * 0.2;

  float causticsVal = caustics(vWorldPos.xz, uTime * 0.15);
  vec3 causticsColor = mint * causticsVal * 0.08 * smoothstep(0.3, 0.7, h);

  vec3 color = baseColor * (ambient + diffuse) + specColor + sssColor + fresnelColor + causticsColor;
  gl_FragColor = vec4(color, 1.0);
}
`

export function CultrBackground() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let cancelled = false

    async function init() {
      const [
        THREE,
        { EffectComposer },
        { RenderPass },
        { UnrealBloomPass },
        { ShaderPass },
        { default: gsap },
      ] = await Promise.all([
        import('three'),
        import('three/examples/jsm/postprocessing/EffectComposer.js'),
        import('three/examples/jsm/postprocessing/RenderPass.js'),
        import('three/examples/jsm/postprocessing/UnrealBloomPass.js'),
        import('three/examples/jsm/postprocessing/ShaderPass.js'),
        import('gsap'),
      ])

      if (cancelled) return

      const isMobile = window.innerWidth < 768
      const segments = isMobile ? 160 : 384
      const dpr = Math.min(window.devicePixelRatio, isMobile ? 2 : 3)
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0x2B4542)

      const aspect = window.innerWidth / window.innerHeight
      const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100)
      camera.position.set(0, isMobile ? 2.8 : 2.2, isMobile ? 3.2 : 3.5)
      camera.lookAt(0, 0, 0)

      const renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: false,
        powerPreference: 'high-performance',
      })
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setPixelRatio(dpr)
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.15
      renderer.outputColorSpace = THREE.SRGBColorSpace
      container.appendChild(renderer.domElement)

      const geometry = new THREE.PlaneGeometry(5.5, 5.5, segments, segments)
      geometry.rotateX(-Math.PI / 2)
      geometry.computeBoundingSphere()

      const uniforms = {
        uTime: { value: 0 },
        uPointer: { value: new THREE.Vector2(0, 0) },
        uPointerStrength: { value: 0 },
        uResolution: { value: new THREE.Vector2(window.innerWidth * dpr, window.innerHeight * dpr) },
      }

      const material = new THREE.ShaderMaterial({
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        uniforms,
        side: THREE.DoubleSide,
      })

      const mesh = new THREE.Mesh(geometry, material)
      scene.add(mesh)

      // Pre-compile shaders to eliminate first-frame stutter
      renderer.compile(scene, camera)

      // Post-processing: HalfFloat render target -> Bloom -> FXAA -> Film grain
      const rtParams = {
        type: THREE.HalfFloatType,
        magFilter: THREE.LinearFilter,
        minFilter: THREE.LinearFilter,
      }
      const renderTarget = new THREE.WebGLRenderTarget(
        window.innerWidth * dpr,
        window.innerHeight * dpr,
        rtParams
      )
      const composer = new EffectComposer(renderer, renderTarget)
      composer.addPass(new RenderPass(scene, camera))

      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        isMobile ? 0.35 : 0.45,
        0.85,
        0.55
      )
      composer.addPass(bloomPass)

      const fxaaPass = new ShaderPass(FXAA_SHADER)
      fxaaPass.uniforms.uResolution.value = new THREE.Vector2(
        window.innerWidth * dpr,
        window.innerHeight * dpr
      )
      composer.addPass(fxaaPass)

      const grainPass = new ShaderPass(FILM_GRAIN_SHADER)
      grainPass.uniforms.uIntensity.value = isMobile ? 0.03 : 0.04
      composer.addPass(grainPass)

      // GSAP pointer smoothing
      const pointer = { x: 0, y: 0, strength: 0 }
      let pointerTween: gsap.core.Tween | null = null

      const onPointerMove = (e: PointerEvent | TouchEvent) => {
        let cx: number, cy: number
        if ('touches' in e && e.touches.length > 0) {
          cx = e.touches[0].clientX
          cy = e.touches[0].clientY
        } else if ('clientX' in e) {
          cx = (e as PointerEvent).clientX
          cy = (e as PointerEvent).clientY
        } else {
          return
        }
        const nx = (cx / window.innerWidth) * 2 - 1
        const ny = -(cy / window.innerHeight) * 2 + 1
        if (pointerTween) pointerTween.kill()
        pointerTween = gsap.to(pointer, {
          x: nx, y: ny, strength: 1,
          duration: 1.2,
          ease: 'power3.out',
        })
      }

      const onPointerLeave = () => {
        if (pointerTween) pointerTween.kill()
        pointerTween = gsap.to(pointer, {
          strength: 0,
          duration: 2.0,
          ease: 'power2.out',
        })
      }

      window.addEventListener('pointermove', onPointerMove, { passive: true })
      window.addEventListener('touchmove', onPointerMove as EventListener, { passive: true })
      window.addEventListener('pointerleave', onPointerLeave)

      // Render first frame then fade in
      uniforms.uTime.value = prefersReducedMotion ? 5 : 0
      composer.render()
      container.style.opacity = '1'

      if (prefersReducedMotion) {
        cleanupRef.current = () => {
          window.removeEventListener('pointermove', onPointerMove)
          window.removeEventListener('touchmove', onPointerMove as EventListener)
          window.removeEventListener('pointerleave', onPointerLeave)
          renderTarget.dispose()
          composer.dispose()
          renderer.dispose()
          geometry.dispose()
          material.dispose()
          if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
        }
        return
      }

      let animationId: number
      let lastTime = performance.now()

      const animate = () => {
        animationId = requestAnimationFrame(animate)
        const now = performance.now()
        const delta = Math.min((now - lastTime) / 1000, 0.05)
        lastTime = now

        uniforms.uTime.value += delta
        uniforms.uPointer.value.set(pointer.x, pointer.y)
        uniforms.uPointerStrength.value = pointer.strength
        grainPass.uniforms.uTime.value = uniforms.uTime.value

        composer.render()
      }

      animate()

      let resizeTimeout: ReturnType<typeof setTimeout>
      const onResize = () => {
        clearTimeout(resizeTimeout)
        resizeTimeout = setTimeout(() => {
          const w = window.innerWidth
          const h = window.innerHeight
          camera.aspect = w / h
          camera.updateProjectionMatrix()
          renderer.setSize(w, h)
          composer.setSize(w, h)
          renderTarget.setSize(w * dpr, h * dpr)
          fxaaPass.uniforms.uResolution.value.set(w * dpr, h * dpr)
          uniforms.uResolution.value.set(w * dpr, h * dpr)
        }, 100)
      }
      window.addEventListener('resize', onResize)

      cleanupRef.current = () => {
        cancelAnimationFrame(animationId)
        clearTimeout(resizeTimeout)
        if (pointerTween) pointerTween.kill()
        window.removeEventListener('pointermove', onPointerMove)
        window.removeEventListener('touchmove', onPointerMove as EventListener)
        window.removeEventListener('pointerleave', onPointerLeave)
        window.removeEventListener('resize', onResize)
        renderTarget.dispose()
        composer.dispose()
        renderer.dispose()
        geometry.dispose()
        material.dispose()
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
      }
    }

    const cleanupRef = { current: () => {} }
    init()

    return () => {
      cancelled = true
      cleanupRef.current()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        opacity: 0,
        transition: 'opacity 0.8s ease-out',
      }}
    />
  )
}

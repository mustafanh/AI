window.initParticles = function initParticles() {
  const isMobile = window.innerWidth <= 768;
  if (isMobile || typeof THREE === "undefined") return;

  const canvas = document.getElementById("particles-canvas");
  if (!canvas) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

  const particleCount = 120;
  const geometry = new THREE.BufferGeometry();
  const positions = [];

  for (let i = 0; i < particleCount; i++) {
    positions.push((Math.random() - 0.5) * 12);
    positions.push((Math.random() - 0.5) * 8);
    positions.push((Math.random() - 0.5) * 8);
  }

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );

  const material = new THREE.PointsMaterial({
    size: 0.035,
    color: 0xa5b8ff,
    transparent: true,
    opacity: 0.65
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  camera.position.z = 4;

  function animate() {
    requestAnimationFrame(animate);
    points.rotation.y += 0.0008;
    points.rotation.x += 0.00025;
    renderer.render(scene, camera);
  }

  animate();

  window.addEventListener("resize", () => {
    if (window.innerWidth <= 768) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
};

window.attachRippleEffect = function attachRippleEffect() {
  document.querySelectorAll("button, .upload-btn").forEach((element) => {
    element.addEventListener("click", function (e) {
      const rect = this.getBoundingClientRect();
      const ripple = document.createElement("span");
      const size = Math.max(rect.width, rect.height);

      ripple.className = "ripple";
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;

      this.appendChild(ripple);

      setTimeout(() => ripple.remove(), 600);
    });
  });
};

window.attachToolsBarDrag = function attachToolsBarDrag() {
  const bar = document.querySelector(".tools-bar");
  if (!bar) return;

  let isDown = false;
  let startX;
  let scrollLeft;

  bar.addEventListener("mousedown", (e) => {
    isDown = true;
    startX = e.pageX - bar.offsetLeft;
    scrollLeft = bar.scrollLeft;
  });

  bar.addEventListener("mouseleave", () => { isDown = false; });
  bar.addEventListener("mouseup", () => { isDown = false; });

  bar.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - bar.offsetLeft;
    const walk = (x - startX) * 1.5;
    bar.scrollLeft = scrollLeft - walk;
  });
};
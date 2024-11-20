// Token Animation System
class TokenAnimationSystem {
    constructor() {
        this.tokens = ['💎', '🪙', '💰', '⚡'];
        this.particleCount = 20;
    }

    createTokenTexture(token) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 64;
        canvas.height = 64;
        ctx.font = '32px Arial';
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(token, canvas.width/2, canvas.height/2);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    createParticleSystem(node1, node2) {
        const particles = new THREE.Group();
        
        // Create particles
        for (let i = 0; i < this.particleCount; i++) {
            const token = this.tokens[Math.floor(Math.random() * this.tokens.length)];
            const spriteMaterial = new THREE.SpriteMaterial({
                map: this.createTokenTexture(token),
                transparent: true,
                opacity: 0.7,
                blending: THREE.AdditiveBlending
            });
            const sprite = new THREE.Sprite(spriteMaterial);
            sprite.scale.set(0.3, 0.3, 0.3);
            
            // Create curved path offset
            const pathOffset = new THREE.Vector3(
                (Math.random() - 0.5) * 0.1,  // Tighter spread for fast movement
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1
            );
            
            sprite.userData = {
                offset: Math.random(),
                speed: 8 + Math.random() * 4, // Ultra-fast speed (8-12)
                pathOffset: pathOffset,
                rotationSpeed: (Math.random() - 0.5) * 1.0, // Much faster rotation
                pulsePhase: Math.random() * Math.PI * 2
            };
            particles.add(sprite);
        }

        particles.userData = {
            node1: node1,
            node2: node2,
            isWalletConnection: 
                (node1.userData.group === 'wallet' || node2.userData.group === 'wallet')
        };

        return particles;
    }

    getParticleCount() {
        return this.particles ? this.particles.children.length : 0;
    }

    updateParticle(particle, node1, node2, direction, delta) {
        if (!particle.visible) return;
        
        // Extreme speed multiplier
        particle.userData.offset += particle.userData.speed * delta * 300;
        if (particle.userData.offset > 1) particle.userData.offset -= 1;

        // Calculate base position along path
        const t = particle.userData.offset;
        const pos = new THREE.Vector3();
        
        // Nearly straight path for extreme speed
        const mid = new THREE.Vector3()
            .addVectors(node1.position, node2.position)
            .multiplyScalar(0.5)
            .add(new THREE.Vector3(0, direction.length() * 0.01, 0)); // Minimal arc
            
        // Quadratic bezier curve calculation
        pos.copy(node1.position.clone().multiplyScalar(Math.pow(1 - t, 2)))
           .add(mid.multiplyScalar(2 * (1 - t) * t))
           .add(node2.position.clone().multiplyScalar(t * t));
        
        // Add minimal offset for visual variety
        pos.add(particle.userData.pathOffset);
        
        // Update particle position
        particle.position.copy(pos);
        
        // Ultra-fast rotation
        particle.rotation.z += particle.userData.rotationSpeed * 2;
        
        // Quick pulse effect
        const time = performance.now() * 0.01;
        const pulse = 0.7 + Math.sin(time * 5 + particle.userData.pulsePhase) * 0.3;
        
        // Instant fade near endpoints
        const fadeNearEnd = Math.min(t * 8, (1 - t) * 8);
        particle.material.opacity = pulse * fadeNearEnd;
        
        // Extreme motion blur effect
        const baseScale = 0.15; // Smaller base size
        const speedScale = 1 + (particle.userData.speed - 8) / 4;
        const scaleWithSpeed = baseScale * (speedScale * 2);
        particle.scale.set(scaleWithSpeed * 3, scaleWithSpeed, scaleWithSpeed); // Extreme horizontal stretch
    }
}

// Export the system
window.TokenAnimationSystem = TokenAnimationSystem;

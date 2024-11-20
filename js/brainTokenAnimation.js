// Brain Token Animation System - Specialized for brain2.html
class BrainTokenAnimation {
    constructor() {
        this.tokens = ['💎', '🪙', '💰', '⚡', '🔮', '🎯'];
        this.particleCount = 30;
        this.baseSpeed = 0.1; // Extremely slow initial speed
        this.speedVariation = 0.03; // Reduced speed variation
        this.pathCurvature = 0.15;
        this.glowIntensity = 0.9;
        this.baseScale = 0.3; // Increased from 0.15 to 0.3
    }

    createTokenTexture(token) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 64;
        canvas.height = 64;
        
        // Create glow effect
        const gradient = ctx.createRadialGradient(
            canvas.width/2, canvas.height/2, 0,
            canvas.width/2, canvas.height/2, canvas.width/2
        );
        gradient.addColorStop(0, 'rgba(255,255,255,0.4)');
        gradient.addColorStop(0.5, 'rgba(255,255,255,0.1)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw token with motion blur effect
        ctx.font = '32px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Draw multiple times for blur effect
        for (let i = 0; i < 3; i++) {
            const offset = i * 2;
            ctx.globalAlpha = 1 - (i * 0.2);
            ctx.fillText(token, canvas.width/2 - offset, canvas.height/2);
        }
        
        return new THREE.CanvasTexture(canvas);
    }

    createParticleSystem(sourceNode, targetNode) {
        const particles = new THREE.Group();
        const direction = new THREE.Vector3().subVectors(targetNode.position, sourceNode.position);
        const distance = direction.length();
        
        // Calculate control points for curved path
        const midPoint = new THREE.Vector3()
            .addVectors(sourceNode.position, targetNode.position)
            .multiplyScalar(0.5);
        const normal = new THREE.Vector3(direction.z, 0, -direction.x).normalize();
        const curveHeight = distance * this.pathCurvature;
        const controlPoint = midPoint.clone().add(normal.multiplyScalar(curveHeight));
        
        for (let i = 0; i < this.particleCount; i++) {
            const token = this.tokens[Math.floor(Math.random() * this.tokens.length)];
            const material = new THREE.SpriteMaterial({
                map: this.createTokenTexture(token),
                transparent: true,
                opacity: this.glowIntensity,
                blending: THREE.AdditiveBlending
            });
            
            const sprite = new THREE.Sprite(material);
            const scale = this.baseScale + Math.random() * 0.2;
            sprite.scale.set(scale * 3, scale, scale);
            
            // Initialize particle properties with extremely slow speed
            sprite.userData = {
                progress: Math.random(),
                speed: this.baseSpeed + (Math.random() - 0.5) * this.speedVariation,
                rotationSpeed: (Math.random() - 0.5) * 0.5, // Slower rotation too
                pulsePhase: Math.random() * Math.PI * 2,
                controlPoint: controlPoint.clone()
            };
            
            particles.add(sprite);
        }
        
        particles.userData = {
            sourceNode: sourceNode,
            targetNode: targetNode,
            controlPoint: controlPoint
        };
        
        return particles;
    }

    updateParticles(particleSystem, deltaTime) {
        const source = particleSystem.userData.sourceNode.position;
        const target = particleSystem.userData.targetNode.position;
        
        // Recalculate control point based on current node positions
        const direction = new THREE.Vector3().subVectors(target, source);
        const distance = direction.length();
        const midPoint = new THREE.Vector3()
            .addVectors(source, target)
            .multiplyScalar(0.5);
        const normal = new THREE.Vector3(direction.z, 0, -direction.x).normalize();
        const curveHeight = distance * this.pathCurvature;
        const controlPoint = midPoint.clone().add(normal.multiplyScalar(curveHeight));
        
        // Update control point in system userData
        particleSystem.userData.controlPoint = controlPoint;
        
        particleSystem.children.forEach(particle => {
            // Update progress
            particle.userData.progress += (particle.userData.speed * deltaTime);
            if (particle.userData.progress > 1) particle.userData.progress -= 1;
            
            const t = particle.userData.progress;
            
            // Quadratic bezier curve calculation with updated control point
            const pos = new THREE.Vector3();
            pos.x = Math.pow(1-t, 2) * source.x + 
                   2 * (1-t) * t * controlPoint.x + 
                   t * t * target.x;
            pos.y = Math.pow(1-t, 2) * source.y + 
                   2 * (1-t) * t * controlPoint.y + 
                   t * t * target.y;
            pos.z = Math.pow(1-t, 2) * source.z + 
                   2 * (1-t) * t * controlPoint.z + 
                   t * t * target.z;
            
            // Update position
            particle.position.copy(pos);
            
            // Update rotation
            particle.rotation.z += particle.userData.rotationSpeed * deltaTime;
            
            // Update opacity with pulse effect
            const pulse = 0.8 + Math.sin(particle.userData.pulsePhase) * 0.2;
            particle.userData.pulsePhase += deltaTime * 5;
            
            // Fade near endpoints
            const fadeNearEnd = Math.min(t * 8, (1 - t) * 8, 1);
            particle.material.opacity = this.glowIntensity * pulse * fadeNearEnd;
            
            // Scale based on speed
            const speedScale = 1 + (particle.userData.speed - this.baseSpeed) / this.speedVariation;
            const baseScale = particle.scale.y; // Use y-scale as base
            particle.scale.set(baseScale * speedScale * 3, baseScale, baseScale);
        });
    }
}

// Export the system
window.BrainTokenAnimation = BrainTokenAnimation;

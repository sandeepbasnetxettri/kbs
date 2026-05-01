document.addEventListener('DOMContentLoaded', () => {
    const glowBlue = document.querySelector('.glow-blue');
    const glowRed = document.querySelector('.glow-red');
    const cards = document.querySelectorAll('.portal-card');

    // Make the ambient glows follow the mouse slightly for a dynamic feel
    document.addEventListener('mousemove', (e) => {
        const mouseX = e.clientX / window.innerWidth - 0.5;
        const mouseY = e.clientY / window.innerHeight - 0.5;

        // Move the blue glow (water)
        if (glowBlue) {
            glowBlue.style.transform = `translate(${mouseX * 100}px, ${mouseY * 100}px)`;
        }

        // Move the red glow (t-shirt) in the opposite direction
        if (glowRed) {
            glowRed.style.transform = `translate(${mouseX * -100}px, ${mouseY * -100}px)`;
        }
    });

    // Add a slight 3D tilt effect to the portal cards
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -10; // Max rotation 10deg
            const rotateY = ((x - centerX) / centerX) * 10;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-12px)`;
        });

        // Reset the transformation when mouse leaves
        card.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)`;

            // Add a smooth transition specifically for the reset
            card.style.transition = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

            setTimeout(() => {
                card.style.transition = ''; // Remove inline transition so CSS hover takes over again
            }, 500);
        });
    });
});

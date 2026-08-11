(function () {
    var form = document.getElementById('intakeForm');
    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var data = new FormData(form);
        var get = function (key) { return (data.get(key) || '').toString().trim(); };

        var lines = [
            'Name: ' + get('name'),
            'Company: ' + get('company'),
            'Work Email: ' + get('email'),
            'Website / Application: ' + get('site'),
            'Security Objective: ' + get('objective'),
            'Service Required: ' + get('service'),
            'Timeline: ' + get('timeline'),
            'Approximate Scope: ' + get('scope'),
            '',
            'Message:',
            get('message')
        ];

        var subject = encodeURIComponent('Security Assessment Request — ' + (get('company') || get('name')));
        var body = encodeURIComponent(lines.join('\n'));
        var status = document.getElementById('intakeStatus');
        if (status) { status.hidden = false; }

        // PLACEHOLDER — no real inbox is configured anywhere in this repo.
        // Replace with the real contact address before this form goes live,
        // or swap this whole handler for a hosted form backend (Formspree,
        // Web3Forms, Getform, etc.) if a real POST endpoint is preferred.
        window.location.href = 'mailto:REPLACE_WITH_YOUR_EMAIL@example.com?subject=' + subject + '&body=' + body;
    });
})();

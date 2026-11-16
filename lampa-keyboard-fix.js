/* Lampa Keyboard Fix v0.1.0 — adjacent-row D-pad navigation.
 * Local UI only. No network calls, storage writes, or key remapping.
 * Disable the extension and restart Lampa to restore original behavior.
 */
(function () {
    'use strict';
    var attempts = 0;
    function boot() {
        var app = window.Lampa, nav = window.Navigator;
        var ctl = app && app.Controller;
        if (!ctl || typeof ctl.enabled !== 'function' || !nav ||
            typeof nav.navigate !== 'function' || typeof nav.focus !== 'function' ||
            typeof nav.getFocusedElement !== 'function') {
            if (++attempts < 40) setTimeout(boot, 250);
            return;
        }
        if (window.__lampaAdjacentRowFix) return;
        var original = nav.navigate;
        var tag = '__adjacentRowHistoryUp';
        function active() { return ctl.enabled() || {}; }
        function inCollection(element) {
            return !nav._collection || Array.prototype.indexOf.call(nav._collection, element) !== -1;
        }
        function usable(element) {
            if (!element || !inCollection(element) || !element.getBoundingClientRect ||
                !document.documentElement.contains(element) || element.classList.contains('hide')) return false;
            var r = element.getBoundingClientRect();
            var s = window.getComputedStyle(element);
            return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
        }
        function xOf(element) {
            var r = element.getBoundingClientRect();
            return (r.left + r.right) / 2;
        }
        function rowKeys(row) {
            return Array.prototype.slice.call(row.querySelectorAll('.hg-button.selector')).filter(usable);
        }
        function rowsOf(root) {
            return Array.prototype.slice.call(root.querySelectorAll('.hg-row')).filter(function (row) {
                return rowKeys(row).length > 0;
            });
        }
        function nearest(keys, x) {
            var best = null, distance = Infinity;
            keys.forEach(function (key) {
                var d = Math.abs(xOf(key) - x);
                if (d < distance) { best = key; distance = d; }
            });
            return best;
        }
        function keyboardInfo(target) {
            if (!target || !target.matches || !target.matches('.hg-button.selector') || !usable(target)) return null;
            var root = target.closest('.simple-keyboard');
            var row = target.closest('.hg-row');
            if (!root || !row) return null;
            var rows = rowsOf(root), index = rows.indexOf(row);
            if (index < 0) return null;
            return {root: root, row: row, rows: rows, index: index};
        }
        nav.navigate = function (target, direction) {
            try {
                if (this === nav && (direction === 'up' || direction === 'down') && active().name === 'keybord') {
                    var info = keyboardInfo(target);
                    if (info) {
                        var next = info.rows[info.index + (direction === 'up' ? -1 : 1)];
                        // At the keyboard boundary, let Lampa's normal controller
                        // handle exiting to history/results or the previous section.
                        return next ? nearest(rowKeys(next), xOf(target)) : null;
                    }
                }
            } catch (e) { console.warn('[Keyboard Fix] fallback', e); }
            return original.apply(this, arguments);
        };
        // Search history normally restores the last used key. Instead, return
        // to the bottom keyboard row, as close as possible to the history chip.
        function patchHistory() {
            var state = active(), c = state.controller;
            if (state.name !== 'search_history' || !c || typeof c.up !== 'function' || c.up[tag]) return;
            var oldUp = c.up;
            var wrapped = function () {
                var x = null;
                try {
                    var previous = nav.getFocusedElement();
                    if (usable(previous)) x = xOf(previous);
                } catch (e) { /* keep the original action */ }
                var result = oldUp.apply(this, arguments);
                try {
                    if (x === null || active().name !== 'keybord') return result;
                    var info = keyboardInfo(nav.getFocusedElement());
                    if (!info && nav._collection) {
                        for (var i = 0; i < nav._collection.length && !info; i++) {
                            info = keyboardInfo(nav._collection[i]);
                        }
                    }
                    if (!info) return result;
                    var next = nearest(rowKeys(info.rows[info.rows.length - 1]), x);
                    if (next && next !== nav.getFocusedElement()) nav.focus(next);
                } catch (e) { console.warn('[Keyboard Fix] history fallback', e); }
                return result;
            };
            wrapped[tag] = true;
            c.up = wrapped;
        }
        if (ctl.listener && typeof ctl.listener.follow === 'function') {
            ctl.listener.follow('toggle', function (event) {
                if (event && event.name === 'search_history') patchHistory();
            });
            patchHistory();
        }
        window.__lampaAdjacentRowFix = true;
        console.log('[Keyboard Fix] v0.1.0 active');
    }
    boot();
})();

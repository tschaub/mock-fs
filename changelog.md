# Change Log

## 2.7.0

 * Support for io.js 2.0 (thanks @jwilsson, see [#38][#38]).

## 2.6.0

 * Add `birthtime` to `Stats` objects (thanks @meandmycode, see [#33][#33]).

## 2.5.0

 * Support for io.js 1.1 (thanks @andrewblond, see [#21][#21]).
 * Testing on Windows with AppVeyor (thanks @andrewblond, see [#22][#22]).

## 2.4.0

 * Support for Node 0.12 (thanks @mlegenhausen, see [#18][#18]).

## 2.3.1

 * Preserve arity of callbacks (see [#11][#11]).

## 2.3.0

 * Fixes for Node 0.11.13 (see [#9][#9]).

## 2.2.0

 * Respect file mode on POSIX-compliant systems (see [#7][#7]).
 * Add benchmarks comparing mock-fs and fs modules (see [#6][#6]).

## 2.1.2

 * Added more complete license text.
 * Test on Node 0.9 and 0.11 in addition to 0.8 and 0.10.

## 2.1.1

 * Added this changelog.
 * Removed unused gruntfile.js.

## 2.1.0

 * Directory mtime is now updated when items are added, removed, or modified ([#2][#2]).
 * Fixed several issues on Windows (see [#3][#3]).  One issue remains on Windows with Node 0.8 (see [#4][#4]).
 * Swapped out Grunt with a single script to run tasks (see [#5][#5]).

## 2.0.0

 * Simplified API (see [#1][#1]).


[#1]: https://github.com/tschaub/mock-fs/pull/1
[#2]: https://github.com/tschaub/mock-fs/pull/2
[#3]: https://github.com/tschaub/mock-fs/pull/3
[#4]: https://github.com/tschaub/mock-fs/issues/4
[#5]: https://github.com/tschaub/mock-fs/pull/5
[#6]: https://github.com/tschaub/mock-fs/pull/6
[#7]: https://github.com/tschaub/mock-fs/pull/7
[#9]: https://github.com/tschaub/mock-fs/issues/9
[#11]: https://github.com/tschaub/mock-fs/pull/11
[#18]: https://github.com/tschaub/mock-fs/pull/18
[#21]: https://github.com/tschaub/mock-fs/pull/21
[#22]: https://github.com/tschaub/mock-fs/pull/22
[#33]: https://github.com/tschaub/mock-fs/pull/33
[#38]: https://github.com/tschaub/mock-fs/pull/38

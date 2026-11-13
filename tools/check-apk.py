"""Check the 16 KB ELF load-segment alignment of every native library in an APK.

Usage: python tools/check-apk.py path/to/app.apk
Also run Android SDK zipalign -c -P 16 4 on the APK to check ZIP placement.
"""
import json
import struct
import sys
import zipfile

failures = []
count = 0
with zipfile.ZipFile(sys.argv[1]) as apk:
    for name in apk.namelist():
        if not name.startswith('lib/') or not name.endswith('.so'):
            continue
        count += 1
        data = apk.read(name)
        if data[:4] != b'\x7fELF' or data[5] != 1:
            failures.append(dict(library=name, reason='Unsupported ELF header'))
            continue
        is64 = data[4] == 2
        offset = struct.unpack_from('<Q' if is64 else '<I', data, 32 if is64 else 28)[0]
        size, number = struct.unpack_from('<HH', data, 54 if is64 else 42)
        for index in range(number):
            segment = offset + index * size
            if struct.unpack_from('<I', data, segment)[0] == 1:
                alignment = struct.unpack_from('<Q' if is64 else '<I', data, segment + (48 if is64 else 28))[0]
                if alignment < 16384:
                    failures.append(dict(library=name, alignment=alignment, segment=index))
print(json.dumps(dict(nativeLibraries=count, passed=count > 0 and not failures, failures=failures), indent=2))
sys.exit(1 if failures or count == 0 else 0)

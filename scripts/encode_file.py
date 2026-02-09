#!/usr/bin/env python3
import argparse
import base64
import hashlib
import hmac
import math
import os
import re
import string
from collections import Counter
from time import perf_counter_ns, perf_counter

startns = perf_counter_ns()
start = perf_counter()

def xor_bytes(data: bytes, key: bytes) -> bytes:
    """XOR data with key, repeating key as needed."""
    return bytes(b ^ key[i % len(key)] for i, b in enumerate(data))


def calculate_entropy(data: bytes) -> float:
    """Calculate Shannon entropy of data."""
    if not data:
        return 0.0
    counter = Counter(data)
    entropy = 0.0
    for count in counter.values():
        probability = count / len(data)
        entropy -= probability * math.log2(probability)
    return entropy


def scramble(data: bytes, seed: bytes) -> bytes:
    """Scramble data by reorganizing bytes using seed."""
    data_list = list(data)
    seed_hash = hashlib.sha256(seed).digest()

    # Reverse every N bytes based on seed
    chunk_size = (seed_hash[0] % 10) + 2
    for i in range(0, len(data_list), chunk_size):
        data_list[i:i + chunk_size] = reversed(data_list[i:i + chunk_size])

    # Shuffle based on seed
    indices = list(range(len(data_list)))
    for i in range(len(indices)):
        swap_idx = (i + seed_hash[i % len(seed_hash)]) % len(indices)
        indices[i], indices[swap_idx] = indices[swap_idx], indices[i]

    data_list = [data_list[j] for j in indices]

    # Rotate bits based on seed
    rotation = seed_hash[1] % 8
    data_list = [((b << rotation) | (b >> (8 - rotation))) & 0xFF for b in data_list]

    return bytes(data_list)


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate keys from a source file.")
    parser.add_argument("input_file", help="Input file path")
    parser.add_argument(
        "--runs",
        nargs="*",
        help="Override runs per size. Example: --runs 64:12 128:1 256:3 512:9"
    )
    parser.add_argument(
        "--select",
        help="Select a specific key to print. Format: SIZE:RUN (e.g. 64:1)"
    )
    args = parser.parse_args()

    input_path = args.input_file
    output_path = "key.txt"

    runs_map = {64: 4, 96:4, 128: 4, 256: 4, 384:4, 512: 4, 768:4, 1024:4, 2048: 4, 4096: 4, 5120:4, 8192: 4, 10240:4}
    if args.runs:
        runs_map = {}
        for entry in args.runs:
            if ":" not in entry:
                raise SystemExit(f"Invalid --runs entry: {entry}. Use SIZE:COUNT.")
            size_str, count_str = entry.split(":", 1)
            try:
                size = int(size_str)
                count = int(count_str)
            except ValueError as exc:
                raise SystemExit(f"Invalid --runs entry: {entry}. Use SIZE:COUNT.") from exc
            if size <= 0 or count <= 0:
                raise SystemExit(f"Invalid --runs entry: {entry}. Values must be > 0.")
            runs_map[size] = count

    sizes = sorted(runs_map.keys())

    with open(input_path, "rb") as f:
        data = f.read()

    stripped = re.sub(rb"\s+", b"", data)
    base_result = base64.b64encode(stripped)

    results = []

    for size in sizes:
        blocks_needed = (size + 31) // 32
        for run_index in range(1, runs_map[size] + 1):
            primary_salt = os.urandom(32)
            selection_salt = os.urandom(32)

            iteration = 0
            prev_entropy = 0.0
            stable_count = 0
            result = base_result

            while True:
                iteration += 1
                seed = hashlib.sha256(result + primary_salt).digest()
                result = scramble(result, seed)
                result = xor_bytes(result, seed)

                entropy = calculate_entropy(result)

                if abs(entropy - prev_entropy) < 0.001:
                    stable_count += 1
                    if stable_count >= 3:
                        break
                else:
                    stable_count = 0

                prev_entropy = entropy

                if iteration >= 1000:
                    break

            blocks = []
            for counter in range(1, blocks_needed + 1):
                counter_bytes = counter.to_bytes(4, "big")
                blocks.append(
                    hmac.new(
                        primary_salt,
                        result + selection_salt + counter_bytes,
                        hashlib.sha256
                    ).digest()
                )
            mixed = b"".join(blocks)[:size]

            hex_output = mixed.hex()
            final_bytes = bytes.fromhex(hex_output)

            charset = string.ascii_letters + string.digits + string.punctuation + " "
            base = len(charset)

            num = int.from_bytes(final_bytes, "big")
            if num == 0:
                final_text = charset[0]
            else:
                chars = []
                while num > 0:
                    num, rem = divmod(num, base)
                    chars.append(charset[rem])
                final_text = "".join(reversed(chars))

            clean_output = base64.urlsafe_b64encode(final_bytes).decode("utf-8").rstrip("=")
            entropy_per_byte = calculate_entropy(final_bytes)
            text_entropy_per_byte = calculate_entropy(final_text.encode("utf-8"))

            results.append(
                {
                    "size": size,
                    "run_index": run_index,
                    "hmac_bytes": len(final_bytes),
                    "hex_length": len(hex_output),
                    "text_length": len(final_text),
                    "entropy_per_byte": entropy_per_byte,
                    "text_entropy_per_byte": text_entropy_per_byte,
                    "total_entropy_bits": len(final_bytes) * entropy_per_byte,
                    "output": final_text,
                    "clean_output": clean_output
                }
            )

    def combined_score(item: dict) -> float:
        return (item["entropy_per_byte"] + item["text_entropy_per_byte"]) / 2.0

    sorted_by_hmac = sorted(results, key=lambda x: x["entropy_per_byte"], reverse=True)
    sorted_by_text = sorted(results, key=lambda x: x["text_entropy_per_byte"], reverse=True)
    sorted_by_combined = sorted(results, key=combined_score, reverse=True)

    def top_per_size(items: list[dict], key_fn) -> list[dict]:
        best = {}
        for item in items:
            size = item["size"]
            current = best.get(size)
            if current is None or key_fn(item) > key_fn(current):
                best[size] = item
        return [best[size] for size in sorted(best.keys())]

    with open(output_path, "wb") as f:
        for item in sorted_by_combined:
            line = f"{item['size']}:{item['run_index']} {item['clean_output']}\n"
            f.write(line.encode("utf-8"))

    def print_table(title: str, items: list[dict]) -> None:
        print(f"\n{title}")
        headers = [
            "Run",
            "Size",
            "Bytes",
            "Hex",
            "Text",
            "Entropy(HMAC)",
            "Entropy(Text)",
            "Combined",
            "Total Bits"
        ]
        rows = []
        for item in items:
            rows.append(
                [
                    str(item["run_index"]),
                    str(item["size"]),
                    str(item["hmac_bytes"]),
                    str(item["hex_length"]),
                    str(item["text_length"]),
                    f"{item['entropy_per_byte']:.4f}",
                    f"{item['text_entropy_per_byte']:.4f}",
                    f"{combined_score(item):.4f}",
                    f"{item['total_entropy_bits']:.1f}"
                ]
            )

        widths = [len(h) for h in headers]
        for row in rows:
            for i, cell in enumerate(row):
                widths[i] = max(widths[i], len(cell))

        header_line = " | ".join(h.ljust(widths[i]) for i, h in enumerate(headers))
        sep_line = "-+-".join("-" * widths[i] for i in range(len(headers)))
        print(header_line)
        print(sep_line)
        for row in rows:
            print(" | ".join(row[i].ljust(widths[i]) for i in range(len(headers))))

    print_table(
        "Final Results — top per size by entropy_hmac",
        top_per_size(sorted_by_hmac, lambda x: x["entropy_per_byte"])
    )
    print_table(
        "Final Results — top per size by entropy_text",
        top_per_size(sorted_by_text, lambda x: x["text_entropy_per_byte"])
    )
    print_table(
        "Final Results — top per size by combined entropy",
        top_per_size(sorted_by_combined, combined_score)
    )

    if args.select:
        if ":" not in args.select:
            raise SystemExit("Invalid --select format. Use SIZE:RUN (e.g. 64:1).")
        size_str, run_str = args.select.split(":", 1)
        try:
            sel_size = int(size_str)
            sel_run = int(run_str)
        except ValueError as exc:
            raise SystemExit("Invalid --select format. Use SIZE:RUN (e.g. 64:1).") from exc
        match = next(
            (item for item in results if item["size"] == sel_size and item["run_index"] == sel_run),
            None
        )
        if not match:
            raise SystemExit(f"No key found for {sel_size}:{sel_run}.")
        print(f"\nSelected {sel_size}:{sel_run}\n{match['clean_output']}")


if __name__ == "__main__":
    main()

endns = perf_counter_ns()
end = perf_counter()

print(f'Total time: {endns - startns}ns')
print(f'Total time: {end - start}s')
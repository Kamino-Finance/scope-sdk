#!/bin/bash

function print_args {
  # pyth
  echo "--account Gnt27xtC473ZT2Mw5u8wZ68Z3gULkSTb5DuxJy7eJotD deps/pyth/Gnt27xtC473ZT2Mw5u8wZ68Z3gULkSTb5DuxJy7eJotD.json"

  # programs
  echo "--bpf-program HFn8GnPADiny6XqUoWE8uRPPxb29ikn4yTuPa9MF2fWJ ./deps/scope/scope.so"

  # scope
  echo "--account 3NJYftD5sjVfxSnUdZ1wVML8f3aC6mp1CXCL6L7TnU8C deps/scope/3NJYftD5sjVfxSnUdZ1wVML8f3aC6mp1CXCL6L7TnU8C.json" # oracle prices
  echo "--account GMprgtqUv2G74GAFHhHhrH21n1cnnNZcPb6TAz5GhqU deps/scope/GMprgtqUv2G74GAFHhHhrH21n1cnnNZcPb6TAz5GhqU.json" # token metadatas

  # options
  echo "--reset --quiet -u m"
}

print_args

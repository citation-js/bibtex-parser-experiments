#!/bin/sh
set -ex
mkdir /tmp/jabref
wget https://builds.jabref.org/master/JabRef-5.2-portable_linux.tar.gz -O /tmp/jabref.tar.gz
tar -xzf /tmp/jabref.tar.gz -C /tmp/jabref --strip 1

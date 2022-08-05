#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

# from __future__ import print_function
# from glob import glob
import os
from setuptools import setup
from optlite import __version__

setup_args = dict(
    version = __version__
)


if __name__ == '__main__':
    setup(**setup_args)

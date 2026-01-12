# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This repo contains source code for user-friendly modern GUI wizard to create devfiles - https://devfile.io/

The application is utilizing the React and Tailwind frameworks to help generate a application that does the following:

Watch Claude Code use MCP servers to build a single page website for generating devfiles via GUI:

    * Claude Code generates a polished React UI with Tailwind
    * Context7 provides current React/Tailwind documentation
    * GUI helps to generate devfile step-by-step based on the devfile 2.3.0 spec
    * It should be possible to download the generated devfile.yaml

More details about the feature can be found on https://github.com/devfile/api/issues/1765 
Devfile docs - https://devfile.io/docs/

## Configuration

The entire application will just be encapsulated in a single web page. There will be no stateful information saved.
